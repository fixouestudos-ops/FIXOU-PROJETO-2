"""Importa o conteúdo programático tabular para a base independente do FIXOU.

Uso: python scripts/import-programa-2027.py caminho/arquivo.pdf
O PDF é necessário somente durante a importação.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import OrderedDict
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SUBJECT_RANGES = [
    (1, 13, "biologia", "Biologia"),
    (14, 17, "filosofia", "Filosofia"),
    (18, 32, "fisica", "Física"),
    (33, 42, "geografia", "Geografia"),
    (43, 55, "historia", "História"),
    (56, 59, "ingles", "Inglês"),
    (60, 74, "matematica", "Matemática"),
    (75, 86, "portugues", "Português"),
    (87, 102, "quimica", "Química"),
    (103, 106, "portugues", "Português"),
    (107, 110, "sociologia", "Sociologia"),
    (111, 113, "portugues", "Português"),
]

SUBJECT_META = {
    "biologia": ("⌁", "#36886f"), "filosofia": ("φ", "#7768b5"),
    "fisica": ("↯", "#4a7fc3"), "geografia": ("◎", "#389699"),
    "historia": ("⌛", "#b2853e"), "ingles": ("En", "#588dba"),
    "matematica": ("ƒ", "#6550d6"), "portugues": ("Aa", "#bd8061"),
    "quimica": ("H₂", "#ae649d"), "sociologia": ("∴", "#ba647c"),
}

AREA_RULES = {
 "biologia": [
  ("Genética e biotecnologia", "genetic dna rna nucleic mendel hered muta biotecn clonagem"),
  ("Ecologia e evolução", "ecolog evolu especie bioma ambiente populac comunidade cadeia sucessao ciclos"),
  ("Citologia e bioquímica", "celul organela membrana quimic seres vivos metabolismo respiracao fermentacao fotossintese"),
  ("Botânica", "planta vegetal botanic briof pterido gimnos angios raiz caule folha"),
  ("Zoologia e fisiologia", "zool animal invertebr vertebr digest circul respir excre endoc nervoso imun"),
 ],
 "fisica": [
  ("Cinemática", "cinematic movimento velocidade aceleracao lancamento grafica vetorial"),
  ("Dinâmica", "dinamic newton forca atrito gravitacao equilibrio torque"),
  ("Energia e quantidade de movimento", "trabalho potencia energia impulso quantidade colis centro de massa"),
  ("Eletricidade e magnetismo", "eletr eletro magnet campo carga circuito resistor capacitor indu"),
  ("Termologia e termodinâmica", "termometr calor gas termodinam dilatacao"),
  ("Óptica e ondas", "optica luz espelho refracao lente onda som ondulator"),
  ("Fluidos", "hidrostatic fluido empuxo pressao pascal"),
 ],
 "quimica": [
  ("Química geral e inorgânica", "atomo tabela period ligacao inorgan acido base sal oxido geometr molecular"),
  ("Química orgânica e bioquímica", "organic carbono hidrocarbon alcool aldeido cetona acido carbox polimer bioquim"),
  ("Transformações e cálculos químicos", "estequiometr reacao balanceamento mol gas estado fisico"),
  ("Soluções e equilíbrio", "solucao solubilidade coligativ equilibrio ph poh hidrolise"),
  ("Energia, cinética e eletroquímica", "termoquim cinetic eletroquim pilha eletrolise radioativ"),
 ],
 "matematica": [
  ("Conjuntos, números e álgebra", "conjunto numero equacao inequacao polinomio complex matriz sistema algebra"),
  ("Funções", "funcao exponencial logaritm progressao sequencia"),
  ("Geometria plana e trigonometria", "geometria plana triangulo quadrilatero poligono circunferencia trigonometria area"),
  ("Geometria analítica", "plano cartesiano reta conica elipse hiperbole parabola analitica"),
  ("Geometria espacial", "poliedro prisma piramide cilindro cone esfera tronco espacial"),
  ("Combinatória, probabilidade e estatística", "combinator probabilidade estatistic binomial contagem"),
  ("Grandezas e matemática financeira", "proporcional porcentagem financeira juros grandeza"),
 ],
 "geografia": [
  ("Cartografia e geotecnologias", "cartograf mapa projecao escala coordenada sensoriamento"),
  ("Geografia física e geomorfologia", "relevo geomorf geolog solo clima hidrograf vegetacao bioma"),
  ("População e urbanização", "demograf populacao migracao urbano cidade urbanizacao"),
  ("Economia, trabalho e redes", "industr agrari agric transport rede energia economia globalizacao capitalismo"),
  ("Geopolítica e regionalização", "geopolit estado territorio guerra bloco europa asia africa america oriente china india russia"),
  ("Meio ambiente", "ambient sustentabilidade recurso natural impacto"),
 ],
 "historia": [
  ("Brasil colonial", "colonial colonia escrav acucar mineracao bandeira imperio iberico"),
  ("Brasil Império", "reinado regencial independencia imperio brasil"),
  ("Brasil republicano", "republica vargas ditadura redemocratizacao brasil contemporaneo"),
  ("Antiguidade e Idade Média", "pre-hist antiguidade grecia roma medieval idade media islamico"),
  ("Idade Moderna", "moderna renascimento reforma monarquia absolut mercantil"),
  ("Mundo contemporâneo", "revolucao industrial francesa atlantic imperialismo guerra fria guerras mundiais crise 1929"),
 ],
 "portugues": [
  ("Gramática e análise linguística", "gramatical morf sintaxe verbo concordancia regencia crase pronome semantica notacional"),
  ("Literatura", "literatura romantismo realismo naturalismo simbolismo modernismo poesia prosa autor obra"),
  ("Produção de texto", "producao de texto dissertacao argument carta artigo editorial manifesto resenha coesao coerencia"),
  ("Interpretação e linguagem", "interpretacao texto tipologia genero discurso figura linguagem sentido textual"),
 ],
 "filosofia": [
  ("Filosofia antiga", "socrates platao aristoteles helenistica antiga nascimento"),
  ("Filosofia medieval", "medieval agostinho aquino escolastica"),
  ("Filosofia moderna", "moderna conhecimento racionalismo empirismo descartes kant politica contratual"),
  ("Filosofia contemporânea", "contemporanea analitica continental ciencia linguagem existencia"),
 ],
 "sociologia": [
  ("Fundamentos da Sociologia", "sociologia ciencia sociedade socializacao instituicao"),
  ("Teoria sociológica", "durkheim weber marx teoria sociologic"),
  ("Cultura e desigualdades", "cultura desigualdade pobreza genero raca identidade preconceito"),
  ("Política, cidadania e movimentos sociais", "politica estado poder cidadania democracia movimento social direito"),
  ("Trabalho e sociedade contemporânea", "trabalho capitalismo industria consumo tecnologia globalizacao ambiente"),
 ],
 "ingles": [
  ("Leitura e estratégias", "reading strategy cognate inference comprehension genre"),
  ("Língua em uso", "grammar vocabulary verb modal pronoun adjective adverb connector"),
  ("Temas e repertório", "people environment art culture science technology society world"),
 ],
}

def norm(value: str) -> str:
    value = unicodedata.normalize("NFD", value or "")
    return re.sub(r"[^a-z0-9]+", " ", "".join(c for c in value.lower() if unicodedata.category(c) != "Mn")).strip()

def slug(value: str) -> str:
    return norm(value).replace(" ", "-")

def subject_for_page(page: int):
    return next(((sid, name) for start, end, sid, name in SUBJECT_RANGES if start <= page <= end), (None, None))

def front_for(page: int, text: str) -> str:
    if 103 <= page <= 106: return "Produção de Texto"
    if 111 <= page <= 113: return "Interpretação de Texto"
    match = re.search(r"FRENTE\s+([0-9]+|ÚNICA)", text, re.I)
    value = match.group(1).title() if match else "Única"
    return "Frente Única" if norm(value) == "unica" else f"Frente {value}"

def classify(subject: str, title: str, contents: list[str]) -> str:
    haystack = norm(title + " " + " ".join(contents))
    best = None
    for order, (area, words) in enumerate(AREA_RULES[subject]):
        score = sum(1 for word in words.split() if word in haystack)
        if score and (best is None or score > best[0]): best = (score, -order, area)
    return best[2] if best else "Fundamentos e aplicações"

def objectives(contents: list[str]) -> list[str]:
    result=[]
    for content in contents:
        for item in re.split(r"\s*•\s*", content)[1:]:
            item=re.sub(r"\s+", " ", item).strip(" .") + "."
            if item not in result: result.append(item)
    return result

def main(pdf_path: Path):
    bank=json.loads((ROOT/"content/bank.json").read_text(encoding="utf-8"))
    collected=OrderedDict()
    with pdfplumber.open(pdf_path) as pdf:
        for page_no, page in enumerate(pdf.pages, 1):
            subject, subject_name=subject_for_page(page_no)
            if not subject: continue
            page_text=page.extract_text() or ""
            front=front_for(page_no,page_text)
            for table in page.extract_tables():
                if not table: continue
                header=[re.sub(r"\s+"," ",(cell or "").replace("\n"," ")).strip().upper() for cell in table[0]]
                if "CAPÍTULO" not in header or "TÍTULO DO CAPÍTULO" not in header or "CONTEÚDO" not in header: continue
                ci,ti,xi=header.index("CAPÍTULO"),header.index("TÍTULO DO CAPÍTULO"),header.index("CONTEÚDO")
                for row in table[1:]:
                    if not row or not row[ci] or not row[ti] or not row[xi]: continue
                    title=re.sub(r"\s+"," ",row[ti].replace("\n"," ")).strip()
                    content=re.sub(r"\s+"," ",row[xi].replace("\n"," ")).strip()
                    key=(subject,front,str(row[ci]).strip(),title)
                    entry=collected.setdefault(key,{"subject":subject,"subjectName":subject_name,"front":front,"originalName":title,"contents":[],"pages":[]})
                    if content not in entry["contents"]: entry["contents"].append(content)
                    if page_no not in entry["pages"]: entry["pages"].append(page_no)
    subjects=[]
    for sid,name in [(x[2],x[3]) for x in SUBJECT_RANGES]:
        if any(s["id"]==sid for s in subjects): continue
        icon,color=SUBJECT_META[sid]
        subject={"id":sid,"name":name,"slug":sid,"icon":icon,"color":color,"fronts":[]}
        entries=[e for e in collected.values() if e["subject"]==sid]
        for front_name in list(OrderedDict.fromkeys(e["front"] for e in entries)):
            front_entries=[e for e in entries if e["front"]==front_name]
            area_names=[]
            for e in front_entries:
                e["area"]=classify(sid,e["originalName"],e["contents"])
                if e["area"] not in area_names: area_names.append(e["area"])
            front={"id":f"{sid}-{slug(front_name)}","name":front_name,"order":len(subject["fronts"])+1,"knowledgeAreas":[]}
            for area_name in area_names:
                area={"id":f"{front['id']}-{slug(area_name)}","name":area_name,"order":len(front["knowledgeAreas"])+1,"topics":[]}
                for e in [x for x in front_entries if x["area"]==area_name]:
                    topic_id=f"p27-{sid}-{slug(front_name)}-{slug(e['originalName'])}"
                    title_norm=norm(e["originalName"])
                    related=[]
                    for c in bank["concepts"]:
                        if c["discipline"] not in ([sid,"literatura"] if sid=="portugues" else [sid]): continue
                        cn=norm(c["subtopic"]+" "+c["topic"])
                        words=[w for w in title_norm.split() if len(w)>3]
                        if title_norm in cn or cn in title_norm or (words and sum(w in cn for w in words)>=max(1,len(words)//2)):
                            related.append(c["id"])
                    qids=[q["id"] for q in bank["questions"] if q["conceptId"] in related]
                    fids=[cid for cid in related if next((c for c in bank["concepts"] if c["id"]==cid and c.get("flashcard")),None)]
                    area["topics"].append({
                        "id":topic_id,"name":e["originalName"],"originalName":e["originalName"],
                        "order":len(area["topics"])+1,"learningObjectives":objectives(e["contents"]),
                        "contentSections":[re.split(r"\s*•\s*",c)[0].strip() for c in e["contents"]],
                        "relatedConceptIds":related,"relatedQuestionIds":qids,"relatedFlashcardIds":fids,
                        "sourcePages":e["pages"]
                    })
                front["knowledgeAreas"].append(area)
            subject["fronts"].append(front)
        subjects.append(subject)
    data={"version":1,"title":"Programa 2027","source":{"file":pdf_path.name,"pages":113,"importedAt":"2026-09-06","usage":"Referência de conteúdo; o site funciona sem o PDF."},"subjects":subjects}
    out=ROOT/"content/programa-2027.json"
    out.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
    summary=[]
    for s in subjects:
        areas=sum(len(f["knowledgeAreas"]) for f in s["fronts"])
        topics=sum(len(a["topics"]) for f in s["fronts"] for a in f["knowledgeAreas"])
        summary.append({"subject":s["name"],"fronts":len(s["fronts"]),"areas":areas,"topics":topics})
    print(json.dumps({"rows":len(collected),"subjects":summary,"totalTopics":sum(x["topics"] for x in summary)},ensure_ascii=False,indent=2))

if __name__ == "__main__":
    if len(sys.argv)!=2: raise SystemExit("Informe o caminho do PDF.")
    main(Path(sys.argv[1]))
