import express from "express";
import cors from "cors"
import multer from "multer"
import {v4 as uuidv4} from "uuid"
import path from "path"
import fs from "fs"
import {exec} from "child_process" // dangerous? (googleWhy)
import { stdout, stderr } from "process";

const app = express();


const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./uploads")
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + "-" + uuidv4()+ path.extname(file.originalname)) 
    }        //(name of the form field), (unique identifier),(extracts the file extension egjpg) 
                                                            //(new file name retains)
})

// multer cofiguration
const upload = multer({storage: storage})




app.use(
    cors({
        origin: ["http://localhost:3000", "http://localhost:5173"],
        credentials: true     //allows cookies and auth headers to be included in req
    })
)

app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*")  // allow anyone @REMINDME
    res.header("Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept");

    //most important step-
    next();
})


app.use(express.json());         // parses incoming requests with JSON payloads
app.use(express.urlencoded({extended: true}));   // extended allows for rich objects and arrays
app.use("/uploads", express.static("uploads"))


app.listen(8000, (req, res)=>{
    console.log("Listening");
})

app.get('/', (req,res)=>{
    res.json({message: "this is pleasent"})
})

app.post('/uploads', upload.single('file'), function(req, res){
    const videoId = uuidv4();
    // we need vidpath coz we give it to ffmpeg
    const videoPath = req.file.path;  // coz we not uploading it to some s3 nd shit
    const outputPath = `./uploads/videos/${videoId}`; // its just the path of the folder for specific videoid .. its not the full path to video.. it just tells in Which directory the video is stored

    // now we want to convert our video to hls
    // hlsPath is where the playlist file is saved that contains the references to media files(segments/chunks)
    const hlsPath =`${outputPath}/index.m3u8`;  // m3u8 is basicaly(googleAnyway) an index file..like if video is divided into chunks..we can know where 3rd chunk is
    console.log(`hlsPath is: ${hlsPath}`); // so basically index.m3u8 file serves as manifest file
    
    // if we don't got outputpath then create one
    if(!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath, {recursive: true})  // recursive is basically that if we don't have some nested directories.. then we can create them
    }

    //ffmpeg-> chatgpt this whole thing..
    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`;


    //to get it run
    exec(ffmpegCommand, (error, stdout, stderr)=>{
        if(error){
            console.log(`execution error: ${error}`)
        }
        console.log(`stdout: ${stdout}`)
        console.log(`stderr: ${stderr}`)
        const videoUrl = `http://localhost:8000/uploads/videos/${videoId}/index.m3u8`;
        res.json({
            message: "Video Converted to HLS format",
            videoUrl: videoUrl,
            videoId: videoId
        })
    })
})