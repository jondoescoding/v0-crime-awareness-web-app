# PRD-11: CCTV Surveillance with VLM Criminal Identification

## Overview
Law enforcement agencies struggle to monitor multiple CCTV feeds simultaneously and manually match suspects against wanted person databases. This feature creates a dedicated CCTV monitoring page where officers can stream multiple camera feeds, with Gemini Vision API automatically identifying wanted criminals in real-time. The system alerts officers when matches are detected, logs timestamps and locations, and generates actionable reports for immediate response.

## Context
This is a **CRITICAL HIGH-VALUE FEATURE** that transforms your app from a reporting tool into an active crime prevention system. Real-time facial recognition against your wanted persons database enables:

1. **Proactive Apprehension**: Catch criminals before they commit new crimes
2. **Resource Optimization**: Direct patrol units to exact locations with confirmed sightings
3. **Evidence Generation**: Automatic timestamped footage for prosecutions
4. **Pattern Analysis**: Track criminal movement patterns across camera networks

**Technical Feasibility**: Gemini 2.0 Flash supports real-time video streaming with sub-second latency and can compare faces against reference images. This is production-ready technology used by major security firms.

**Legal Considerations**: This feature requires strict compliance with surveillance laws, data retention policies, and civil rights protections. Implementation MUST include audit trails, access controls, and consent mechanisms.

**Expected Impact**: 40% increase in wanted person apprehensions, 25% reduction in repeat offenses in monitored areas.

## Requirements

### Functional Requirements

1. **Multi-Camera Feed Management**
   - Officers add CCTV cameras via RTSP/HTTP stream URLs
   - Support for 1-16 simultaneous camera feeds in grid layout (1x1, 2x2, 3x3, 4x4)
   - Each feed shows: camera name, location, connection status, last detection timestamp
   - Drag-and-drop to reorder camera positions
   - Save camera layouts as presets: "Downtown Patrol", "School Zone Monitoring"
   - Offline cameras show red indicator with last-seen timestamp
   - Auto-reconnect on connection loss with exponential backoff

2. **Real-Time Criminal Detection**
   - System extracts frames from video streams every 2-5 seconds (configurable)
   - Frames sent to Gemini Vision API with prompt: "Is any person in this image a match for these wanted criminals? [reference images]"
   - Gemini compares detected faces against wanted persons database images
   - Match threshold: 85% confidence minimum (configurable per deployment)
   - Detection overlay: Green box around detected faces, red box + flashing border for criminal matches
   - Audio alert plays when match detected (can be muted per camera)
   - Match triggers immediate database logging with screenshot and metadata

3. **Wanted Person Database Integration**
   - System loads all wanted persons with images from existing database
   - Officers can filter which criminals to monitor: "High Priority Only", "Violent Offenders", "Specific Individuals"
   - Reference images preprocessed and cached for faster comparison
   - Database updates automatically sync to monitoring system within 30 seconds
   - Officers can mark criminals as "Do Not Monitor" (e.g., already apprehended)

4. **Alert and Notification System**
   - Match detection triggers:
     - On-screen toast notification with criminal name, camera location, confidence score
     - Browser push notification if officer has multiple tabs open
     - Optional SMS/email alert for critical matches (armed/dangerous suspects)
     - Entry in alerts feed with "Respond" action button
   - Alert details include:
     - Criminal name, photo, wanted crime
     - Camera name and location
     - Detection timestamp
     - Confidence score (85-100%)
     - Screenshot of detection with face highlighted
     - Suggested response actions: "Dispatch Unit", "View Live Feed", "Review Recording"
   - Officers can dismiss alerts or mark as "False Positive" to improve accuracy

5. **Evidence Collection and Logging**
   - Every detection logged to database with:
     - Criminal ID, camera ID, timestamp, confidence score
     - Screenshot of detection moment (stored in Convex file storage)
     - 30-second video clip buffer (15 seconds before + 15 seconds after detection)
     - GPS coordinates of camera location
     - Responding officer ID if dispatched
   - Evidence automatically tagged for legal chain of custody
   - Retention policy: 90 days for matches, 7 days for non-matches
   - Export evidence package as ZIP with timestamps and metadata JSON

6. **Live Feed Controls**
   - Per-camera controls:
     - Pause/resume stream
     - Zoom into region of interest
     - Take manual screenshot
     - Toggle detection overlay
     - Adjust detection sensitivity
   - Global controls:
     - Mute/unmute all alerts
     - Pause detection on all cameras
     - Switch between layout presets
     - Enter fullscreen mode for single camera

7. **Detection History and Analytics**
   - Timeline view showing all detections across all cameras
   - Heatmap showing which cameras have most detections
   - Individual criminal tracking: "John Doe detected 3 times in last 24 hours at cameras A, B, C"
   - Movement pattern visualization on map
   - Detection success rate: true positives vs false positives
   - Average detection latency metrics

### Technical Requirements

#### Backend / Services

**New Service: `backend/src/services/cctv_monitor.py`**
```python
class CCTVMonitorService:
    def __init__(self, gemini_client: genai.Client):
        self.gemini = gemini_client
        self.active_streams: Dict[str, VideoStreamProcessor] = {}
        
    async def start_monitoring(
        self, 
        camera_id: str, 
        stream_url: str,
        wanted_persons: List[WantedPerson]
    ) -> None:
        """Start monitoring a camera feed."""
        processor = VideoStreamProcessor(
            camera_id=camera_id,
            stream_url=stream_url,
            gemini_client=self.gemini,
            wanted_persons=wanted_persons,
            detection_callback=self.on_detection
        )
        await processor.start()
        self.active_streams[camera_id] = processor
        
    async def on_detection(
        self,
        detection: CriminalDetection
    ) -> None:
        """Handle detected criminal match."""
        # Log to database
        await self.log_detection(detection)
        
        # Trigger alerts
        await self.send_alerts(detection)
        
        # Capture evidence
        await self.capture_evidence(detection)
        
    async def process_frame(
        self,
        frame: np.ndarray,
        wanted_persons: List[WantedPerson]
    ) -> List[FaceMatch]:
        """
        Send frame to Gemini Vision for analysis.
        Returns list of matched criminals with confidence scores.
        """
```

**New Service: `backend/src/services/video_stream_processor.py`**
```python
class VideoStreamProcessor:
    def __init__(
        self,
        camera_id: str,
        stream_url: str,
        gemini_client: genai.Client,
        wanted_persons: List[WantedPerson],
        detection_callback: Callable
    ):
        self.camera_id = camera_id
        self.stream_url = stream_url
        self.gemini = gemini_client
        self.wanted_persons = wanted_persons
        self.callback = detection_callback
        self.frame_interval = 3  # Process every 3 seconds
        
    async def start(self) -> None:
        """Connect to stream and start processing."""
        cap = cv2.VideoCapture(self.stream_url)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                await self.handle_disconnect()
                break
                
            # Process frame every N seconds
            if self.should_process_frame():
                matches = await self.analyze_frame(frame)
                
                if matches:
                    for match in matches:
                        await self.callback(match)
                        
    async def analyze_frame(
        self, 
        frame: np.ndarray
    ) -> List[CriminalDetection]:
        """Send frame to Gemini for facial recognition."""
        # Convert frame to base64
        _, buffer = cv2.imencode('.jpg', frame)
        image_base64 = base64.b64encode(buffer).decode()
        
        # Build prompt with wanted person images
        prompt = self.build_detection_prompt()
        
        # Call Gemini Vision API
        response = await self.gemini.models.generate_content_async(
            model="gemini-2.0-flash-exp",
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {
                            "mime_type": "image/jpeg",
                            "data": image_base64
                        }}
                    ] + [
                        {"inline_data": {
                            "mime_type": "image/jpeg", 
                            "data": person.image_base64
                        }} for person in self.wanted_persons
                    ]
                }
            ],
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": CriminalMatchSchema
            }
        )
        
        return self.parse_detections(response)
```

**New Models: `backend/src/models/cctv.py`**
```python
class Camera(BaseModel):
    id: str
    name: str
    location: Location
    stream_url: str
    stream_type: Literal["RTSP", "HTTP", "HLS"]
    status: Literal["online", "offline", "error"]
    last_frame_timestamp: Optional[int]
    detection_enabled: bool
    sensitivity: float  # 0.85-0.99
    created_by: str
    created_at: int

class CriminalDetection(BaseModel):
    detection_id: str
    camera_id: str
    criminal_id: str
    criminal_name: str
    criminal_image_url: str
    wanted_for: str
    confidence_score: float
    detection_timestamp: int
    frame_screenshot_url: str
    video_clip_url: Optional[str]
    bounding_box: BoundingBox
    responding_officer_id: Optional[str]
    false_positive: bool
    notes: Optional[str]

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class DetectionAlert(BaseModel):
    alert_id: str
    detection: CriminalDetection
    alert_type: Literal["high_priority", "standard", "low_priority"]
    notification_sent: List[str]  # email, sms, push
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[int]
    action_taken: Optional[str]
```

**API Endpoints: `backend/src/api/cctv.py`**
```python
@router.post("/cameras", response_model=Camera)
async def add_camera(
    camera: CameraCreate,
    current_user: User = Depends(get_current_user)
) -> Camera:
    """Add new CCTV camera to monitoring system."""
    
@router.get("/cameras", response_model=List[Camera])
async def list_cameras() -> List[Camera]:
    """List all configured cameras."""

@router.post("/cameras/{camera_id}/start")
async def start_monitoring(camera_id: str) -> dict:
    """Start monitoring a camera feed."""
    
@router.post("/cameras/{camera_id}/stop")
async def stop_monitoring(camera_id: str) -> dict:
    """Stop monitoring a camera feed."""

@router.get("/detections", response_model=List[CriminalDetection])
async def list_detections(
    camera_id: Optional[str] = None,
    criminal_id: Optional[str] = None,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None
) -> List[CriminalDetection]:
    """Query detection history with filters."""

@router.post("/detections/{detection_id}/false-positive")
async def mark_false_positive(detection_id: str) -> dict:
    """Mark detection as false positive to improve accuracy."""

@router.get("/stream/{camera_id}")
async def stream_camera_feed(camera_id: str):
    """WebSocket endpoint for streaming camera feed to frontend."""
```

**Performance Targets**
- Frame processing latency: < 500ms per frame
- Detection-to-alert time: < 2 seconds
- Support 16 simultaneous streams at 1080p
- False positive rate: < 10%
- True positive rate: > 90% (for confidence >= 85%)

#### Frontend / Client

**New Page: `frontend/app/cctv/page.tsx`**
```typescript
export default function CCTVPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [layout, setLayout] = useState<"1x1" | "2x2" | "3x3" | "4x4">("2x2");
  const [detections, setDetections] = useState<CriminalDetection[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  
  return (
    <div className="h-screen flex flex-col">
      {/* Top Control Bar */}
      <CCTVControlBar
        cameras={cameras}
        layout={layout}
        onLayoutChange={setLayout}
        onAddCamera={() => setShowAddCamera(true)}
      />
      
      {/* Main Grid View */}
      <div className="flex-1 flex">
        {/* Camera Grid */}
        <div className="flex-1 p-4">
          <CameraGrid
            cameras={cameras}
            layout={layout}
            onCameraSelect={setSelectedCamera}
          />
        </div>
        
        {/* Sidebar */}
        <div className="w-96 border-l">
          <Tabs defaultValue="detections">
            <TabsList>
              <TabsTrigger value="detections">Detections</TabsTrigger>
              <TabsTrigger value="wanted">Wanted List</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detections">
              <DetectionFeed detections={detections} />
            </TabsContent>
            
            <TabsContent value="wanted">
              <WantedPersonsList />
            </TabsContent>
            
            <TabsContent value="settings">
              <CCTVSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Active Alerts Overlay */}
      <AlertsOverlay detections={detections} />
    </div>
  );
}
```

**Component: `frontend/components/cctv/camera-grid.tsx`**
```typescript
export function CameraGrid({ 
  cameras, 
  layout, 
  onCameraSelect 
}: CameraGridProps) {
  const gridCols = {
    "1x1": "grid-cols-1",
    "2x2": "grid-cols-2",
    "3x3": "grid-cols-3",
    "4x4": "grid-cols-4"
  }[layout];
  
  return (
    <div className={`grid ${gridCols} gap-4 h-full`}>
      {cameras.map(camera => (
        <CameraFeed
          key={camera.id}
          camera={camera}
          onSelect={() => onCameraSelect(camera.id)}
        />
      ))}
    </div>
  );
}
```

**Component: `frontend/components/cctv/camera-feed.tsx`**
```typescript
export function CameraFeed({ camera, onSelect }: CameraFeedProps) {
  const [detection, setDetection] = useState<CriminalDetection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // WebSocket connection for live feed
  useEffect(() => {
    const ws = new WebSocket(`ws://api/stream/${camera.id}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "frame") {
        // Update video frame
        if (videoRef.current) {
          videoRef.current.src = data.frame_url;
        }
      } else if (data.type === "detection") {
        // Show detection overlay
        setDetection(data.detection);
        
        // Play alert sound
        playAlert();
      }
    };
    
    return () => ws.close();
  }, [camera.id]);
  
  return (
    <div 
      className={`relative rounded-lg overflow-hidden border-2 ${
        detection ? "border-red-500 animate-pulse" : "border-gray-300"
      }`}
      onClick={onSelect}
    >
      {/* Video Feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
      />
      
      {/* Camera Info Overlay */}
      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            camera.status === "online" ? "bg-green-500" : "bg-red-500"
          }`} />
          <span>{camera.name}</span>
        </div>
        <span className="text-gray-300">{camera.location.address}</span>
      </div>
      
      {/* Detection Overlay */}
      {detection && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Bounding box around detected face */}
          <div
            className="absolute border-4 border-red-500 animate-pulse"
            style={{
              left: detection.bounding_box.x,
              top: detection.bounding_box.y,
              width: detection.bounding_box.width,
              height: detection.bounding_box.height
            }}
          />
          
          {/* Detection Label */}
          <div className="absolute bottom-2 left-2 right-2 bg-red-600 text-white p-2 rounded">
            <div className="font-bold">{detection.criminal_name}</div>
            <div className="text-xs">
              Wanted: {detection.wanted_for} | 
              Confidence: {Math.round(detection.confidence_score * 100)}%
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Controls */}
      <div className="absolute bottom-2 right-2 flex gap-2">
        <Button size="sm" variant="secondary" onClick={(e) => {
          e.stopPropagation();
          takeScreenshot();
        }}>
          <Camera className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={(e) => {
          e.stopPropagation();
          toggleDetection();
        }}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Component: `frontend/components/cctv/detection-feed.tsx`**
```typescript
export function DetectionFeed({ detections }: DetectionFeedProps) {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      {detections.map(detection => (
        <Card 
          key={detection.detection_id}
          className="border-l-4 border-red-500"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <img
                src={detection.criminal_image_url}
                alt={detection.criminal_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <CardTitle className="text-sm">{detection.criminal_name}</CardTitle>
                <CardDescription className="text-xs">
                  {detection.wanted_for}
                </CardDescription>
              </div>
              <Badge variant="destructive">
                {Math.round(detection.confidence_score * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              {formatDistanceToNow(detection.detection_timestamp)} ago
            </div>
            <div className="text-xs text-muted-foreground">
              <MapPin className="inline h-3 w-3 mr-1" />
              Camera: {cameras.find(c => c.id === detection.camera_id)?.name}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Users className="h-3 w-3 mr-1" />
                Dispatch Unit
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**State Management**
- Camera connections managed via WebSocket subscriptions
- Detections stored in Convex real-time database
- Alert state managed in React context for cross-component access
- Video buffer stored in IndexedDB for evidence capture

#### Data / Infrastructure

**Schema Updates: `convex/schema.ts`**
```typescript
cameras: defineTable({
  name: v.string(),
  location: v.object({
    address: v.string(),
    lat: v.number(),
    lng: v.number()
  }),
  streamUrl: v.string(),
  streamType: v.union(v.literal("RTSP"), v.literal("HTTP"), v.literal("HLS")),
  status: v.union(v.literal("online"), v.literal("offline"), v.literal("error")),
  lastFrameTimestamp: v.optional(v.number()),
  detectionEnabled: v.boolean(),
  sensitivity: v.number(),
  createdBy: v.string(),
  createdAt: v.number()
})
.index("by_status", ["status"])
.index("by_created", ["createdAt"]),

criminalDetections: defineTable({
  cameraId: v.id("cameras"),
  criminalId: v.id("criminals"),
  criminalName: v.string(),
  criminalImageUrl: v.string(),
  wantedFor: v.string(),
  confidenceScore: v.number(),
  detectionTimestamp: v.number(),
  frameScreenshotId: v.id("_storage"),
  videoClipId: v.optional(v.id("_storage")),
  boundingBox: v.object({
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number()
  }),
  respondingOfficerId: v.optional(v.string()),
  falsePositive: v.boolean(),
  notes: v.optional(v.string())
})
.index("by_camera", ["cameraId", "detectionTimestamp"])
.index("by_criminal", ["criminalId", "detectionTimestamp"])
.index("by_timestamp", ["detectionTimestamp"]),

detectionAlerts: defineTable({
  detectionId: v.id("criminalDetections"),
  alertType: v.union(
    v.literal("high_priority"),
    v.literal("standard"),
    v.literal("low_priority")
  ),
  notificationsSent: v.array(v.string()),
  acknowledgedBy: v.optional(v.string()),
  acknowledgedAt: v.optional(v.number()),
  actionTaken: v.optional(v.string())
})
.index("by_acknowledged", ["acknowledgedBy", "acknowledgedAt"])
```

**Environment Variables**
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.0-flash-exp
DETECTION_CONFIDENCE_THRESHOLD=0.85
FRAME_PROCESSING_INTERVAL_SECONDS=3
MAX_CONCURRENT_STREAMS=16
VIDEO_CLIP_BUFFER_SECONDS=30
ALERT_HIGH_PRIORITY_CRIMES=Murder,Kidnapping,Armed Robbery
SMS_ALERT_ENABLED=true
EMAIL_ALERT_ENABLED=true
```

### Implementation Details

**Gemini Vision Prompt**
```
You are a law enforcement facial recognition system. Analyze this surveillance camera frame and compare all visible faces against the provided wanted persons database.

For each face detected:
1. Determine if it matches any wanted person (minimum 85% confidence)
2. If match found, return: person_id, confidence_score, bounding_box coordinates
3. If no match, return empty result

Wanted Persons Database:
[Image 1] - John Doe, wanted for Murder
[Image 2] - Jane Smith, wanted for Armed Robbery
[Image 3] - ...

Surveillance Frame:
[Current camera frame]

Return JSON:
{
  "detections": [
    {
      "person_id": "criminal_123",
      "person_name": "John Doe",
      "confidence": 0.92,
      "bounding_box": {"x": 120, "y": 80, "width": 100, "height": 120},
      "reasoning": "Strong facial feature match, similar build"
    }
  ],
  "faces_detected": 3,
  "processing_time_ms": 450
}
```

**Video Stream Processing Pipeline**
```python
async def process_video_stream(camera: Camera):
    cap = cv2.VideoCapture(camera.stream_url)
    frame_count = 0
    last_detection_time = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            logger.error(f"Failed to read frame from {camera.name}")
            await handle_reconnect(camera)
            continue
        
        frame_count += 1
        current_time = time.time()
        
        # Process every Nth frame based on interval setting
        if current_time - last_detection_time >= FRAME_PROCESSING_INTERVAL:
            # Resize frame for faster processing
            resized = cv2.resize(frame, (1280, 720))
            
            # Send to Gemini for analysis
            detections = await analyze_frame_with_gemini(
                resized, 
                wanted_persons=get_active_wanted_persons()
            )
            
            if detections:
                for detection in detections:
                    await process_detection(
                        detection=detection,
                        camera=camera,
                        frame=frame,
                        timestamp=current_time
                    )
            
            last_detection_time = current_time
        
        # Stream frame to frontend via WebSocket
        await broadcast_frame(camera.id, frame)
        
        await asyncio.sleep(0.033)  # ~30 FPS
```

**False Positive Reduction**
- Track detection frequency: Require 2+ detections within 10 seconds to confirm
- Face quality check: Reject blurry or poorly lit faces
- Motion analysis: Reject static images or printed photos
- Liveness detection: Ensure face is from live person, not photo/video
- Manual review queue: All detections with confidence 85-90% require officer confirmation

**Evidence Chain of Custody**
```python
class EvidencePackage:
    def __init__(self, detection: CriminalDetection):
        self.detection_id = detection.detection_id
        self.collected_at = datetime.now(timezone.utc)
        self.collected_by = current_officer.id
        
    def generate_package(self) -> ZipFile:
        """Create evidence package with all supporting materials."""
        zip_file = ZipFile(f"evidence_{self.detection_id}.zip")
        
        # Add detection screenshot
        zip_file.write("screenshot.jpg", self.get_screenshot())
        
        # Add video clip
        zip_file.write("video_clip.mp4", self.get_video_clip())
        
        # Add metadata JSON
        metadata = {
            "detection_id": self.detection_id,
            "criminal_name": self.detection.criminal_name,
            "wanted_for": self.detection.wanted_for,
            "confidence_score": self.detection.confidence_score,
            "detection_timestamp": self.detection.detection_timestamp,
            "camera_location": self.get_camera_location(),
            "chain_of_custody": self.get_custody_chain(),
            "sha256_hashes": self.compute_file_hashes()
        }
        zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
        
        # Add audit log
        zip_file.writestr("audit_log.txt", self.get_audit_log())
        
        return zip_file
```

### UX / UI Guidance

**Visual Design**
- Dark theme for reduced eye strain during long monitoring sessions
- High contrast for critical alerts (red for matches, green for clear)
- Fullscreen mode with minimal chrome for focus
- Status indicators use universally recognized colors (red/yellow/green)

**Alert Hierarchy**
1. **CRITICAL** (red, audio + vibration): Murder, kidnapping, armed robbery suspects
2. **HIGH** (orange, audio): Violent crime suspects
3. **MEDIUM** (yellow, visual only): Property crime suspects
4. **LOW** (blue, silent): Persons of interest

**Accessibility**
- All alerts have audio and visual components
- Screen reader announces "Criminal detected: [name] at [location]"
- Keyboard shortcuts: Space to pause, M to mute, F to fullscreen
- High contrast mode available
- Adjustable alert volume and sensitivity

**Mobile Considerations**
- Responsive layout: 1 camera on mobile, 4 on tablet, 16 on desktop
- Push notifications for critical alerts
- Simplified controls for touch interfaces
- Offline mode shows last known frame

## File Structure
```
backend/src/
├── api/
│   └── cctv.py                        # New: CCTV endpoints
├── services/
│   ├── cctv_monitor.py                # New: Main monitoring service
│   ├── video_stream_processor.py     # New: Video processing
│   ├── gemini_vision_client.py        # New: Gemini API integration
│   └── evidence_collector.py          # New: Evidence packaging
├── models/
│   └── cctv.py                        # New: Camera, Detection models
└── tests/
    ├── test_cctv_monitor.py           # New: Service tests
    └── test_gemini_vision.py          # New: API integration tests

frontend/
├── app/
│   └── cctv/
│       ├── page.tsx                   # New: Main CCTV page
│       └── layout.tsx                 # New: CCTV-specific layout
├── components/
│   └── cctv/
│       ├── camera-grid.tsx            # New: Camera layout grid
│       ├── camera-feed.tsx            # New: Individual camera feed
│       ├── detection-feed.tsx         # New: Detection list sidebar
│       ├── alerts-overlay.tsx         # New: Active alerts overlay
│       ├── control-bar.tsx            # New: Top controls
│       └── settings-panel.tsx         # New: CCTV settings
├── lib/
│   ├── websocket-manager.ts           # New: WebSocket connections
│   └── evidence-exporter.ts           # New: Evidence package export
└── convex/
    ├── cameras.ts                     # New: Camera CRUD operations
    ├── detections.ts                  # New: Detection logging
    └── schema.ts                      # Modified: Add CCTV tables

.env.local
├── GEMINI_API_KEY                     # New
├── DETECTION_CONFIDENCE_THRESHOLD=0.85 # New
├── FRAME_PROCESSING_INTERVAL=3        # New
└── MAX_CONCURRENT_STREAMS=16          # New
```

## Dependencies

**Backend**
- `google-generativeai==0.3.0` - Gemini Vision API client
- `opencv-python==4.9.0.80` - Video processing
- `numpy==1.26.3` - Image array manipulation
- `pillow==10.2.0` - Image encoding/decoding
- `websockets==12.0` - Real-time streaming
- `ffmpeg-python==0.2.0` - Video clip extraction

**Frontend**
- `react-webcam==7.2.0` - Camera preview (for testing)
- No additional packages (WebSocket native, video via HTML5)

**Infrastructure**
- Gemini API with vision model access
- WebSocket server (already in FastAPI)
- RTSP/HTTP stream support
- File storage for evidence (Convex storage or S3)

**Cost Estimation**
- Gemini Vision: $0.001 per frame analyzed
- 16 cameras × 20 frames/minute × 60 min × 24 hours = 460,800 frames/day
- Daily cost: 460,800 × $0.001 = $460/day = $13,800/month
- **Cost optimization**: Only process frames when motion detected → $2,000/month

## Success Criteria

1. **Detection Accuracy**: 90% true positive rate, < 10% false positive rate
2. **Response Time**: Detection-to-alert < 2 seconds for 95% of cases
3. **System Uptime**: 99.5% availability for monitoring service
4. **Apprehension Rate**: 40% increase in wanted person arrests within 3 months
5. **Officer Adoption**: 80% of patrol officers use system within 2 weeks

**Monitoring Metrics**
- Detections per camera per day
- False positive rate (tracked via officer feedback)
- Average detection-to-response time
- Video stream uptime per camera
- Gemini API latency and error rate
- Cost per detection

## Open Questions

1. **Legal Compliance**: What surveillance laws apply in Jamaica? Need consent signage?
   - Owner: Legal team + Product
   - Due: BEFORE any implementation
   - **CRITICAL**: Must obtain legal clearance before building

2. **Data Retention**: How long should we store detection footage?
   - Owner: Legal + Compliance team
   - Due: Week 1
   - Recommendation: 90 days for matches, 7 days for non-matches, per UK GDPR standards

3. **Access Control**: Who can add cameras? View feeds? Access evidence?
   - Owner: Security team
   - Due: Week 1
   - Recommendation: Role-based: Admin (add cameras), Officer (view feeds), Detective (access evidence)

4. **Camera Integration**: What CCTV systems are already deployed? Compatibility?
   - Owner: Partnership team + Law enforcement
   - Due: Week 2
   - Recommendation: Support standard protocols (RTSP, HTTP) for maximum compatibility

5. **Cost Management**: How to keep Gemini costs under control?
   - Owner: Engineering + Finance
   - Due: Week 1
   - **CRITICAL**: Implement motion detection + frame sampling to reduce costs by 80%

6. **False Positive Handling**: What's acceptable false positive rate for deployment?
   - Owner: Law enforcement stakeholders
   - Due: Week 2
   - Recommendation: Target < 5% after tuning, require officer confirmation for confidence < 95%

## Notes

**Implementation Tips**
- **START WITH PILOT**: Deploy to 2-4 cameras first, tune accuracy before scaling
- Use motion detection as pre-filter to reduce Gemini API costs by 80%
- Implement frame quality checks before sending to Gemini (reject blurry frames)
- Cache wanted person reference images preprocessed for faster comparison
- Use Gemini batch API for processing queued frames to reduce costs
- Implement circuit breaker to prevent cascade failures
- Log all detections for continuous model improvement

**Legal and Ethical Considerations**
- **MANDATORY**: Display signage informing public of surveillance in monitored areas
- Implement strict access controls: audit log for all feed access
- Data retention policies must comply with local privacy laws
- Officers must be trained on proper use and civil rights implications
- Bias testing: Ensure system performs equally across different demographics
- Appeal process for wrongful identification
- Regular accuracy audits by independent third party

**Rollout Considerations**
- **Phase 1 (Weeks 1-3)**: Legal clearance + pilot with 2 cameras + internal testing
- **Phase 2 (Weeks 4-6)**: Expand to 8 cameras + accuracy tuning + officer training
- **Phase 3 (Weeks 7-8)**: Full deployment to 16+ cameras + public announcement
- **Phase 4 (Weeks 9-12)**: Integration with dispatch systems + mobile alerts

**Follow-up Features**
- Mobile app for officers to receive alerts in field
- Integration with police dispatch systems (CAD integration)
- Pattern analysis: "Suspect seen at these 3 locations, predict next appearance"
- Multi-camera tracking: Follow suspect across camera network
- License plate recognition for vehicle tracking
- Crowd analysis for event monitoring
- Weapon detection (separate from face recognition)
- Integration with existing police body cam systems

**Risk Mitigation**
- Privacy advocates may oppose facial recognition deployment
  - **Mitigation**: Transparency, public consultation, clear policies
- High false positive rate could erode officer trust
  - **Mitigation**: Extensive pilot testing, conservative confidence thresholds
- System downtime could miss critical detections
  - **Mitigation**: Redundant infrastructure, local caching, offline mode
- Adversarial attacks (criminals disguising appearance)
  - **Mitigation**: Multi-factor identification (gait, build, clothing), human review
- Cost overruns from high API usage
  - **Mitigation**: Motion detection, frame sampling, batch processing

**Training Requirements**
- 4-hour training for officers on system operation
- 2-hour legal/civil rights training
- Ongoing monthly refreshers on false positive handling
- Certification required before system access granted

This feature has the potential to be **transformative for law enforcement effectiveness** but carries significant legal, ethical, and technical complexity. Success requires close partnership with legal counsel, law enforcement agencies, and civil rights organizations. The technical implementation is feasible with current VLM technology, but the operational deployment requires careful planning and stakeholder buy-in.

