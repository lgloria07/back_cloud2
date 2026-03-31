import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const app = express();
app.use(cors());

ffmpeg.setFfmpegPath(ffmpegPath);

const upload = multer({ dest: "uploads/" });

app.post("/convert", upload.single("audio"), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = inputPath + ".wav";

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .format("wav")
        .save(outputPath)
        .on("end", resolve)
        .on("error", reject);
    });

    const wavBuffer = fs.readFileSync(outputPath);

    res.set({
      "Content-Type": "audio/wav",
      "Content-Disposition": "attachment; filename=audio.wav"
    });

    res.send(wavBuffer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Servidor en http://localhost:3001");
});