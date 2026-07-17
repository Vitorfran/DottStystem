import sqlite3
import urllib.request
import json
import re
import os
import sys

# Garantir que o script encontre as dependências instaladas no venv
sys.path.append(os.path.join(os.path.dirname(__file__), "venv", "Lib", "site-packages"))

try:
    import chromadb
    from langflow.services.settings.factory import SettingsServiceFactory
    from langflow.services.auth import utils as auth_utils
except ImportError as e:
    print(f"Erro ao importar dependências: {e}")
    print("Certifique-se de executar o script utilizando o Python do venv:")
    print("  .\\venv\\Scripts\\python.exe ingest.py")
    sys.exit(1)

def get_api_key():
    """Recupera e descriptografa a GOOGLE_API_KEY diretamente do banco do Langflow."""
    # Tenta encontrar o banco nos locais conhecidos
    db_paths = [
        os.path.join("venv", "Lib", "site-packages", "langflow", "langflow.db"),
        os.path.join("venv", "Lib", "site-packages", "flow_backend", "langflow.db"),
    ]
    db_path = None
    for p in db_paths:
        if os.path.exists(p):
            db_path = p
            break
            
    if not db_path:
        raise FileNotFoundError("Não foi possível encontrar o arquivo langflow.db nas dependências.")
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Busca a variável GOOGLE_API_KEY
    cursor.execute("SELECT value FROM variable WHERE name='GOOGLE_API_KEY';")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise ValueError("Variável GOOGLE_API_KEY não encontrada no banco do Langflow. Configure-a na interface.")
        
    encrypted_value = row[0]
    
    # Inicializa as configurações para descriptografar usando Fernet do Langflow
    settings_service = SettingsServiceFactory().create()
    fernet = auth_utils.get_fernet(settings_service)
    
    decrypted_key = fernet.decrypt(encrypted_value.encode()).decode()
    return decrypted_key

def parse_knowledge(file_path):
    """Processa o arquivo Markdown e gera blocos de texto limpos e estruturados."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    sections = re.split(r"^(##\s+.*)$", content, flags=re.MULTILINE)
    chunks = []
    current_section = "Geral"
    
    i = 0
    while i < len(sections):
        part = sections[i].strip()
        if not part:
            i += 1
            continue
            
        if part.startswith("##"):
            current_section = part.replace("##", "").strip()
            # Remove qualquer texto extra entre parênteses
            current_section_clean = re.sub(r"\s*\(.*\)", "", current_section)
            i += 1
            if i < len(sections):
                body = sections[i].strip()
                lines = body.split("\n")
                lines_iter = iter(lines)
                for line in lines_iter:
                    line = line.strip()
                    if not line:
                        continue
                        
                    # Agrupa Pergunta e Resposta no FAQ
                    if "Pergunta:" in line:
                        pergunta_clean = re.sub(r"^[\*\-]\s*\*\*Pergunta:\*\*\s*", "", line).strip()
                        
                        resposta_line = ""
                        try:
                            while True:
                                next_line = next(lines_iter).strip()
                                if next_line:
                                    resposta_line = next_line
                                    break
                        except StopIteration:
                            pass
                            
                        resposta_clean = re.sub(r"^\s*\*\*Resposta:\*\*\s*", "", resposta_line).strip()
                        chunks.append({
                            "text": f"Pergunta: {pergunta_clean}\nResposta: {resposta_clean}",
                            "metadata": {"categoria": current_section_clean, "tipo": "FAQ"}
                        })
                    
                    # Linhas normais de Serviços ou Informações
                    elif line.startswith("* **") or line.startswith("- **"):
                        clean_line = re.sub(r"^[\*\-]\s*", "", line).strip()
                        
                        # Tenta extrair o nome do serviço para metadados simples
                        match_servico = re.match(r"^\*\*(.*?)\*\*:", clean_line)
                        servico_nome = match_servico.group(1) if match_servico else "Geral"
                        
                        chunks.append({
                            "text": f"{current_section_clean} - {clean_line}",
                            "metadata": {"categoria": current_section_clean, "servico": servico_nome}
                        })
                    else:
                        chunks.append({
                            "text": f"{current_section_clean} - {line}",
                            "metadata": {"categoria": current_section_clean}
                        })
            i += 1
        else:
            lines = part.split("\n")
            for line in lines:
                line = line.strip()
                if line and not line.startswith("#"):
                    chunks.append({
                        "text": line,
                        "metadata": {"categoria": "Geral"}
                    })
            i += 1
            
    return chunks

def get_embedding(text, api_key):
    """Gera o vetor de embedding usando a API do Gemini."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {
            "parts": [{"text": text}]
        }
    }
    
    req = urllib.request.Request(url)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(payload).encode('utf-8')
    
    try:
        with urllib.request.urlopen(req, data=data) as response:
            res_data = json.loads(response.read().decode())
            return res_data["embedding"]["values"]
    except Exception as e:
        print(f"Erro ao gerar embedding para o texto '{text[:30]}...': {e}")
        raise e

def main():
    print("Iniciando importação da base de conhecimento para o Chroma DB...")
    
    # 1. Recupera a chave de API
    try:
        api_key = get_api_key()
        print("✓ Chave de API Google obtida com sucesso.")
    except Exception as e:
        print(f"❌ Erro ao obter chave de API: {e}")
        return
        
    # 2. Processa o arquivo Markdown
    markdown_file = "dott_knowledge.md"
    if not os.path.exists(markdown_file):
        print(f"❌ Arquivo {markdown_file} não encontrado na raiz do projeto.")
        return
        
    chunks = parse_knowledge(markdown_file)
    print(f"✓ Arquivo Markdown processado em {len(chunks)} blocos.")
    
    # 3. Inicializa o cliente do Chroma
    persist_dir = "./meubanco"
    client = chromadb.PersistentClient(path=persist_dir)
    
    # 4. Obtém ou cria a coleção 'langflow' (mapeada no Langflow como lf_8909e93b666a19da)
    collection_name = "lf_8909e93b666a19da"
    
    # Remove a coleção existente se houver para limpar dados antigos/duplicados
    try:
        client.delete_collection(collection_name)
        print(f"✓ Coleção antiga '{collection_name}' removida para limpeza.")
    except Exception:
        pass
        
    collection = client.create_collection(collection_name)
    print(f"✓ Nova coleção '{collection_name}' criada.")
    
    # 5. Gera embeddings e insere no Chroma DB
    print("\nInserindo blocos no banco de dados (isso pode levar alguns segundos)...")
    
    ids = []
    documents = []
    embeddings = []
    metadatas = []
    
    for idx, chunk in enumerate(chunks):
        text = chunk["text"]
        metadata = chunk["metadata"]
        
        # Gera o embedding
        vector = get_embedding(text, api_key)
        
        ids.append(f"doc_{idx}")
        documents.append(text)
        embeddings.append(vector)
        metadatas.append(metadata)
        
        # Inserção em lotes a cada 10 registros ou no fim
        if len(ids) >= 10 or idx == len(chunks) - 1:
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )
            print(f"  -> Inseridos {idx + 1}/{len(chunks)} blocos...")
            # Limpa listas para o próximo lote
            ids, documents, embeddings, metadatas = [], [], [], []
            
    print("\n✓ Sucesso! A base de conhecimento foi indexada e inserida na coleção 'langflow'.")
    print(f"Total de documentos ativos: {collection.count()}")

if __name__ == "__main__":
    main()
