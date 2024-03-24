import arrr

async def translate_english(event):
  print("Translate English")
  input_text = document.querySelector("#english")
  english = input_text.value
  print(arrr.translate(english))

  res = await window.get("https://raw.githubusercontent.com/codeforamerica/ohana-api/master/data/sample-csv/contacts.csv")
  print(res)