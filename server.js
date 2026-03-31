import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: "uploads/" });

ffmpeg.setFfmpegPath(ffmpegPath);

// CORS
app.use(cors({
  origin: "https://black-meadow-0858b400f.4.azurestaticapps.net"
}));

// opcional pero recomendado
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando 🚀");
});

// Ruta para convertir audio
app.post("/convert", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No se subió ningún archivo");
  }

  const inputPath = req.file.path;
  const outputPath = `${inputPath}.wav`;

  ffmpeg(inputPath)
    .audioCodec("pcm_s16le")
    .audioFrequency(16000)
    .audioChannels(1)
    .format("wav")
    .save(outputPath)
    .on("end", () => {
      res.sendFile(path.resolve(outputPath), (err) => {
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
        if (err) {
          console.error("Error enviando archivo:", err);
        }
      });
    })
    .on("error", (err) => {
      console.error("Error en ffmpeg:", err);
      res.status(500).send("Error al convertir audio");
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});