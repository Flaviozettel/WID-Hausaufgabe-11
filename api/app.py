from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pyproj import Transformer
from fastapi.responses import StreamingResponse
import csv



transformerlv95TOwgs84 = Transformer.from_crs("EPSG:2056", "EPSG:4326", always_xy=True)
transformerwgs84TOlv95 = Transformer.from_crs("EPSG:4326", "EPSG:2056", always_xy=True)

app = FastAPI()

app.add_middleware( 
CORSMiddleware, 
allow_origins=["*"],   
allow_credentials=True, 
allow_methods=["*"], 
allow_headers=["*"], 
) 

@app.get("/lv95TOwgs84")
async def lv95TOwgs84(E1: float, E2: float):  #Mit Query(....) <- ... könnten für E und N bestimtme Parameter eingefügt werden z.B. Wertebereich oder Beschreibung
    try:
        A1, A2 = transformerlv95TOwgs84.transform(E1, E2)
        return {"lat": A1, "long": A2}
    except Exception as e:
        return {"error": str(e)}

@app.get("/wgs84TOlv95")
async def wgs84TOlv95(E1: float, E2: float):
    try:
        A1, A2 = transformerwgs84TOlv95.transform(E1, E2)
        return {"x": A1, "y": A2}
    except Exception as e:
        return {"error": str(e)}
    























@app.post("/{methode}/uploadfile/")
async def upload_file(methode: str, file: UploadFile):
    try:
        # Dateiinhalt lesen und decodieren
        Datei = await file.read()
        Punkte = csv.DictReader(Datei.decode("utf-8").splitlines())

        # Liste für transformierte Punkte
        trans_Punkte = []
        for punkt in Punkte:
            try:
                # Originalkoordinaten aus der CSV extrahieren
                x = float(punkt["Koordinate_X"])
                y = float(punkt["Koordinate_Y"])
                id_ = punkt["ID"]
                name = punkt["Name"]

                # Transformation basierend auf der Methode
                if methode == "lv95TOwgs84":
                    lat, long = transformerlv95TOwgs84.transform(x, y)
                    trans_Punkte.append(
                        {"ID": id_, "Name": name, "Koordinate_X": x, "Koordinate_Y": y, "lat": lat, "long": long}
                    )
                elif methode == "wgs84TOlv95":
                    x, y = transformerwgs84TOlv95.transform(x, y)
                    trans_Punkte.append(
                        {"ID": id_, "Name": name, "lat": x, "long": y, "Koordinate_X": x, "Koordinate_Y": y}
                    )
                else:
                    return {"error": "Unbekannte Methode"}
            except Exception as e:
                return {"error": f"Fehler bei Punkt ID {punkt['ID']}: {str(e)}"}

        # Ausgabedatei erstellen
        Datei_Ausgabe = "trans_Punkte.csv"
        with open(Datei_Ausgabe, mode="w", newline="") as csvfile:
            writer = csv.DictWriter(
                csvfile,
                fieldnames=["ID", "Name", "Koordinate_X", "Koordinate_Y", "lat", "long"]
                if methode == "lv95TOwgs84"
                else ["ID", "Name", "lat", "long", "Koordinate_X", "Koordinate_Y"],
            )
            writer.writeheader()
            writer.writerows(trans_Punkte)

        # Datei als StreamingResponse zurückgeben
        def iterfile():
            with open(Datei_Ausgabe, mode="rb") as file:
                yield from file

        return StreamingResponse(
            iterfile(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{Datei_Ausgabe}"'},
        )

    except Exception as e:
        return {"error": str(e)}
