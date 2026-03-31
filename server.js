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

// Asegurar que exista la carpeta uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

ffmpeg.setFfmpegPath(ffmpegPath);

// Permitir peticiones del frontend
app.use(cors());

// Para leer JSON si luego lo necesitas
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

// Ruta de prueba para confirmar que /convert existe
app.get("/convert", (req, res) => {
  res.send("Ruta /convert existe, pero usa POST");
});

// Ruta para convertir audio
app.post("/convert", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No se subió ningún archivo");
    }

    const inputPath = req.file.path;
    const outputPath = `${inputPath}.wav`;

    console.log("Archivo recibido:", req.file.originalname);
    console.log("Input path:", inputPath);
    console.log("Output path:", outputPath);

    ffmpeg(inputPath)
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .on("end", () => {
        console.log("Conversión completada");

        res.setHeader("Content-Type", "audio/wav");

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
      })
      .save(outputPath);

  } catch (error) {
    console.error("Error general:", error);
    res.status(500).send("Error interno del servidor");
  }
});
//prueba

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});