import React, { useState } from "react";
import {
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";

function App() {
  const [E1, setE1] = useState(0);
  const [E2, setE2] = useState(0);
  const [A1, setA1] = useState(0);
  const [A2, setA2] = useState(0);
  const [methode, setMethode] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [fileA, setFileA] = useState(null);

  const Umwandlung = async () => {
    try {
      const antwort = await axios.get(`http://127.0.0.1:8000/${methode}`, {
        params: { E1: parseFloat(E1), E2: parseFloat(E2) },
      });
      setA1(antwort.data.lat);
      setA2(antwort.data.long);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Fehler bei der Umrechnung. Überprüfe die Eingabe oder die Verbindung."
      );
      console.error(err);
    }
  };

  const Fileumwandlung = async () => {
    if (!file) {
      setError("Keine Datei ausgewählt.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/${methode}/uploadfile/`,
        formData,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "konvertierte_punkte.csv";

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Fehler beim Datei-Upload. Überprüfe die Verbindung oder die Datei."
      );
      console.error(err);
    }
  };

  return (
    <Container>
      <h1>Koordinatenumwandlung</h1>
      <Select
        value={methode}
        onChange={(e) => setMethode(e.target.value)}
        fullWidth
        margin="normal"
      >
        <MenuItem value="" disabled>
          Wähle eine Methode
        </MenuItem>
        <MenuItem value="lv95TOwgs84">lv95TOwgs84</MenuItem>
        <MenuItem value="wgs84TOlv95">wgs84TOlv95</MenuItem>
      </Select>
      <TextField
        label={methode === "lv95TOwgs84" ? "lat" : "x"}
        onChange={(e) => setE1(e.target.value)}
        type="number"
        margin="normal"
        fullWidth
      />
      <TextField
        label={methode === "lv95TOwgs84" ? "long" : "y"}
        onChange={(e) => setE2(e.target.value)}
        type="number"
        margin="normal"
        fullWidth
      />
      <br />
      <Button onClick={Umwandlung} variant="contained" color="primary">
        Umwandlung
      </Button>
      <br />
      <br />
      {error && (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      )}
      <Typography variant="h6">
        {methode &&
          `Resultat: ${methode === "lv95TOwgs84" ? "lat" : "x"}: ${A1}, ${
            methode === "lv95TOwgs84" ? "long" : "y"
          }: ${A2}`}
      </Typography>
      <br />
      <Button variant="contained" component="label">
        Punktliste Hochladen
        <input
          type="file"
          hidden
          onChange={(e) => setFile(e.target.files[0])}
        />
      </Button>
      <br />
      <br />
      <Button
        variant="contained"
        color="primary"
        onClick={Fileumwandlung}
        disabled={!file || !methode}
      >
        Punktliste Umwandeln : {methode || "Keine Methode ausgewählt"}
      </Button>
      <br />
    </Container>
  );
}

export default App;
