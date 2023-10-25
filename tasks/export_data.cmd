soffice --headless --convert-to "csv:Text - txt - csv (StarCalc):44,34,UTF8,1," --outdir docs/assets/data/ raw_assets/data/*.ods
python tasks/clean_data.py