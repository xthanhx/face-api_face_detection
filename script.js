Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.loadSsdMobilenetv1Model("/models"),
]).then(start);

const isSnaped = { enable: false };
const canvas = document.getElementById("canvas");
const imageCanvas = document.getElementById("image");

const video = document.getElementById("video");

const button = document.getElementById("button");
button.addEventListener("click", () => {
  isSnaped.enable = false;
  imageCanvas.getContext("2d").clearRect(0, 0, imageCanvas.width, imageCanvas.height);
});

const drawImage = (video) => {
  const displaySize = { width: video.width, height: video.height };
  imageCanvas.width = displaySize.width;
  imageCanvas.height = displaySize.height;
  const canvasContext = imageCanvas.getContext("2d");
  canvasContext.drawImage(video, 0, 0, imageCanvas.width, imageCanvas.height);
  console.log(imageCanvas.toDataURL());
};

video.addEventListener("play", () => {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (!detection) return;

    if (detection.detection.score > 0.95) {
      if (
        !isSnaped.enable &&
        detection.expressions.neutral > 0.95 &&
        checkFrontalFace(detection.landmarks)
      ) {
        console.log(detection);
        drawImage(video);
        isSnaped.enable = true;
      }
    }

    const canvasContext = canvas.getContext("2d");
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    const box = detection.detection.box;
    const centerX = box.x + box.width / 1.3;
    const centerY = box.y + box.height / 1.5;
    const radius = Math.max(box.width, box.height) / 1.5;

    canvasContext.strokeStyle = "red"; // Change stroke color
    canvasContext.lineWidth = 2; // Change line width
    canvasContext.beginPath();
    canvasContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    canvasContext.stroke();
    // faceapi.draw.drawDetections(canvas, resizedDetection);
  }, 15);
});

function start() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

function checkFrontalFace(landmarks) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const eyeAngle = Math.abs(
    Math.atan2(rightEye[0].y - leftEye[3].y, rightEye[0].x - leftEye[3].x)
  );
  console.log(eyeAngle);
  return eyeAngle <= Math.PI / 6;
}
