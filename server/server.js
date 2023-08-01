const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const PDFdocument = require("pdfkit");
const fs = require("fs");
const {google} = require("googleapis");
const dotenv = require("dotenv");

dotenv.config({})

const app = express();

const port = process.env.PORT || 5000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.use(bodyParser.json({limit: "10mb"}));
app.use(bodyParser.urlencoded({limit: "10mb", extended: true}))

app.use(cors({origin: '*'}));

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


 
app.post("/convertImageToPDF", upload.array('noteImages'), (req, res) => {
    const imageFiles = req.files;
    const pdfPath = path.join(__dirname, 'output.pdf');
    const doc = new PDFdocument({size: "A4", margin: 10});

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
    
  //clean up
    fs.unlinkSync(pdfPath); // Delete the generated PDF file after sending it to the client

    imageFiles.forEach((file) => {
      fs.unlinkSync(file.path);
    })
    
  //upload to Google drive
})

app.listen(port, () => {
    console.log("Server is running successfully");
})