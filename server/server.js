const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const PDFdocument = require("pdfkit");
const fs = require("fs");
const { google } = require("googleapis");
const { createCanva, loadImage } = require("canvas");
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

async function uploadToDrive(pdfPath, noteName) { 
  const drive = google.drive({version: 'v3', auth});

  const fileMetadata = {
    name: noteName,
  };

  const media = {
    mimeType: 'application/pdf',
    body: fs.createReadStream(pdfPath)
  }

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    console.log("Successfully created");
  } catch (err) {
    console.error("Error uploading file to Google Drive: ", err);
  }
}
 
app.post("/convertImageToPDF", upload.array('noteImages'), async (req, res) => {
  const imageFiles = req.files;
  const pdfPath = path.join(__dirname, 'output.pdf');
  const doc = new PDFdocument();
  const accessToken = req.headers.authorization.split(' ')[1];
  const noteName = req.query.name;

  auth.setCredentials({ access_token: accessToken });
  
  console.log(imageFiles);
  
  
  doc.pipe(fs.createWriteStream(pdfPath));

  imageFiles.forEach((file) => {
    doc.image(file.path, {
      fit: [500, 500],
      align: 'center',
      valign: 'center'
    })
    .addPage();
  })

  // Finalize the PDF and save it to the specified file path
  doc.end();

  console.log("Successfully created");

  
  try {
    uploadToDrive(pdfPath, noteName).then(() => {
      // Delete the generated PDF file after sending it to the client
    res.sendFile(pdfPath, () => {
        fs.unlinkSync(pdfPath);

    imageFiles.forEach((file) => {
      fs.unlinkSync(file.path);
    })
    })
  })
  } catch (err) {
    console.error("Error uploading file to Google Drive: ", err);
  }
    
  //upload to Google drive
})



app.listen(port, () => {
    console.log("Server is running successfully");
})