const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const PDFdocument = require("pdfkit");
const fs = require("fs");

const port = 5000;

const app = express();

app.use(bodyParser.json({limit: "10mb"}));
app.use(bodyParser.urlencoded({limit: "10mb", extended: true}))

app.use(cors());

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  limits: {
    // Increase the field size limit to 10MB (adjust as needed)
    fieldSize: 10 * 1024 * 1024, // 10MB in bytes
  },
});


app.get("/", (req, res) => {
    res.send("Hello World, welcome to the Universe of Note-Keeper");
})

app.post("/convert-to-pdf", upload.array('noteImages'), (req, res) => {
    const imageFiles = req.files;
    const pdfPath = path.join(__dirname, 'output.pdf');
    const doc = new PDFdocument({size: "A4", margin: 50});

    doc.pipe(fs.createWriteStream(pdfPath));

    imageFiles.forEach((file) => {
        doc.addPage();
        doc.image(file.path, {
            fit: [500, 500],
            align: 'center',
            valign: 'center'
        })
    })

    doc.end()
    
    res.sendFile(pdfPath, () => {
        fs.unlinkSync(pdfPath); // Delete the generated PDF file after sending it to the client

        imageFiles.forEach((file) => {
            fs.unlinkSync(file.path);
        })
    });
    
    console.log(pdfPath);
})

app.listen(port, () => {
    console.log("Server is running successfully");
})