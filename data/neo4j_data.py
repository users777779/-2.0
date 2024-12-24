from flask import Flask, jsonify
from neo4j import GraphDatabase

app = Flask(__name__)

# 连接到 Neo4j 数据库
uri = "neo4j://localhost:7689"
username = "neo4j"
password = "Zjh165619."
driver = GraphDatabase.driver(uri, auth=(username, password))

# 查询图数据的函数
def get_graph_data():
    with driver.session() as session:
        result = session.run("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100")
        data = []
        for record in result:
            node1 = record["n"]
            relation = record["r"]
            node2 = record["m"]
            data.append({
                "node1": {"id": node1.id, "label": node1["name"]},
                "relation": {"type": relation.type},
                "node2": {"id": node2.id, "label": node2["name"]}
            })
        return data

# 定义一个处理 /graph 路径的视图函数
@app.route("/graph")
def graph():
    data = get_graph_data()  # 获取图数据
    return jsonify(data)  # 返回 JSON 格式的数据

# 定义根路径的视图函数
@app.route('/')
def home():
    return "Hello, World!"

# 运行 Flask 应用
if __name__ == "__main__":
    app.run(debug=True)
