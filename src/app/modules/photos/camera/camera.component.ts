import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { WebcamInitError } from '../domain/webcam-init-error';
import { WebcamImage } from '../domain/webcam-image';
import { Observable, Subscription } from 'rxjs';
import { WebcamUtil } from '../util/webcam.util';
import { WebcamMirrorProperties } from '../domain/webcam-mirror-properties';
import { CameraService } from '../services/camera.service';

@Component
  ({
    selector: 'ng-camera',
    templateUrl: './camera.component.html'
  })

export class CameraComponent implements AfterViewInit, OnDestroy {

  private static DEFAULT_VIDEO_OPTIONS: MediaTrackConstraints = { facingMode: 'environment' }

  @Input() public width: number = 640;
  @Input() public height: number = 480;
  @Input() public videoOptions: MediaTrackConstraints = CameraComponent.DEFAULT_VIDEO_OPTIONS;
  @Input() public allowCameraSwitch: boolean = true;
  @Input() public mirrorImage: string | WebcamMirrorProperties;

  private triggerSubscription: Subscription;
  private switchCameraSubscription: Subscription;
  private mediaStream: MediaStream = null;
  private activeVideoInputIndex: number = -1;
  private activeVideoSettings: MediaTrackSettings = null;

  public availableVideoInputs: MediaDeviceInfo[] = [];
  public videoInitialized: boolean = false;
  public filename: string = "";
  public photogo: boolean = false;

  @Output() public imageCapture: EventEmitter<WebcamImage> = new EventEmitter<WebcamImage>();
  @Output() public initError: EventEmitter<WebcamInitError> = new EventEmitter<WebcamInitError>();
  @Output() public imageClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() public cameraSwitched: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('video') private video: any;
  @ViewChild('canvas') private canvas: any;

  public dataFile: any;
  public subscription: Subscription;
  public subscription2: Subscription;

  constructor
    (
    private _cameraService: CameraService,
  ) {
    this.subscription = this._cameraService.getSnapshot().subscribe((resp: any) => {
      this.takeSnapshot(resp.code);
    });
  }

  public ngAfterViewInit(): void {
    this.detectAvailableDevices()
      .then((devices: MediaDeviceInfo[]) => {
        this.switchToVideoInput(devices.length > 0 ? devices[0].deviceId : null);
      })
      .catch((err: string) => {
        this.initError.next(<WebcamInitError>{ message: err });
        this.switchToVideoInput(null);
      });
  }

  public ngOnDestroy(): void {
    this.stopMediaTracks();
    this.unsubscribeFromSubscriptions();

  }

  @Input()
  public set switchCamera(switchCamera: Observable<boolean | string>) {
    if (this.switchCameraSubscription) {
      this.switchCameraSubscription.unsubscribe();
    }
  }

  private static getMediaConstraintsForDevice(deviceId: string, baseMediaTrackConstraints: MediaTrackConstraints): MediaTrackConstraints {
    let result: MediaTrackConstraints = baseMediaTrackConstraints ? baseMediaTrackConstraints : this.DEFAULT_VIDEO_OPTIONS;

    if (deviceId) {
      result.deviceId = { exact: deviceId };
    }

    return result;
  }

  private static getDeviceIdFromMediaStreamTrack(mediaStreamTrack: MediaStreamTrack): string {
    if (mediaStreamTrack.getSettings && mediaStreamTrack.getSettings() && mediaStreamTrack.getSettings().deviceId) {
      return mediaStreamTrack.getSettings().deviceId;
    }
    else if (mediaStreamTrack.getConstraints && mediaStreamTrack.getConstraints() && mediaStreamTrack.getConstraints().deviceId) {
      let deviceIdObj: ConstrainDOMString = mediaStreamTrack.getConstraints().deviceId;
      return CameraComponent.getValueFromConstrainDOMString(deviceIdObj);
    }
  }

  private static getValueFromConstrainDOMString(constrainDOMString: ConstrainDOMString): string {
    if (constrainDOMString) {
      if (constrainDOMString instanceof String) {
        return String(constrainDOMString);
      }
      else if (Array.isArray(constrainDOMString) && Array(constrainDOMString).length > 0) {
        return String(constrainDOMString[0]);
      }
      else if (typeof constrainDOMString === "object") {
        if (constrainDOMString["exact"]) {
          return String(constrainDOMString["exact"]);
        }
        else if (constrainDOMString["ideal"]) {
          return String(constrainDOMString["ideal"]);
        }
      }
    }
    return null;
  }

  public takeSnapshot(code: string): void {
    let _canvas = this.canvas.nativeElement;
    _canvas.getContext('2d').drawImage(this.video.nativeElement, 0, 0);
    let mimeType: string = "image/jpeg";
    let dataUrl: string = _canvas.toDataURL(mimeType);
    this.dataFile = dataUrl;
    this._cameraService.sendSnapshotEmmit(code, this.dataFile);
  }

  public rotateVideoInput(forward: boolean) {
    if (this.availableVideoInputs && this.availableVideoInputs.length > 1) {
      let increment: number = forward ? 1 : (this.availableVideoInputs.length - 1);
      this.switchToVideoInput(this.availableVideoInputs[(this.activeVideoInputIndex + increment) % this.availableVideoInputs.length].deviceId)
    }
  }

  public switchToVideoInput(deviceId: string): void {
    this.videoInitialized = false;
    this.stopMediaTracks();
    this.initWebcam(deviceId, this.videoOptions);
  }

  public get videoWidth() {
    let videoRatio = this.getVideoAspectRatio(this.activeVideoSettings);
    return Math.min(this.width, this.height * videoRatio);
  }

  public get videoHeight() {
    let videoRatio = this.getVideoAspectRatio(this.activeVideoSettings);
    return Math.min(this.height, this.width / videoRatio);
  }

  public get videoStyleClasses() {
    let classes: string = "";
    if (this.isMirrorImage()) {
      classes += "mirrored";
    }
    return classes.trim();
  }

  private getVideoAspectRatio(mediaTrackSettings: MediaTrackSettings): number {
    if (mediaTrackSettings) {
      if (mediaTrackSettings.aspectRatio) {
        return mediaTrackSettings.aspectRatio;
      }
      else if (mediaTrackSettings.width && mediaTrackSettings.width > 0 && mediaTrackSettings.height && mediaTrackSettings.height > 0) {
        return mediaTrackSettings.width / mediaTrackSettings.height;
      }
    }
    return this.width / this.height;
  }

  private initWebcam(deviceId: string, userVideoTrackConstraints: MediaTrackConstraints) {
    let _video = this.video.nativeElement;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      let videoTrackConstraints = CameraComponent.getMediaConstraintsForDevice(deviceId, userVideoTrackConstraints);
      navigator.mediaDevices.getUserMedia(<MediaStreamConstraints>{ video: videoTrackConstraints })
        .then((stream: MediaStream) => {
          this.mediaStream = stream;
          _video.srcObject = stream;
          _video.play();

          this.activeVideoSettings = stream.getVideoTracks()[0].getSettings();
          let activeDeviceId: string = CameraComponent.getDeviceIdFromMediaStreamTrack(stream.getVideoTracks()[0]);
          this.activeVideoInputIndex = activeDeviceId ? this.availableVideoInputs
            .findIndex((mediaDeviceInfo: MediaDeviceInfo) => mediaDeviceInfo.deviceId === activeDeviceId) : -1;
          this.videoInitialized = true;
          this.cameraSwitched.next(activeDeviceId);
        })
        .catch((err: MediaStreamError) => {
          this.initError.next(<WebcamInitError>{ message: err.message, mediaStreamError: err });
        })
    }
    else {
      this.initError.next(<WebcamInitError>{ message: "Cannot read UserMedia from MediaDevices." });
    }
  }

  private getActiveVideoTrack(): MediaStreamTrack {
    return this.mediaStream ? this.mediaStream.getVideoTracks()[0] : null;
  }

  private isMirrorImage(): boolean {
    if (!this.getActiveVideoTrack()) {
      return false;
    }
    else {
      let mirror: string = "auto";
      if (this.mirrorImage) {
        if (typeof this.mirrorImage === "string") {
          mirror = String(this.mirrorImage).toLowerCase();
        }
        else {
          if (this.mirrorImage.x) {
            mirror = this.mirrorImage.x.toLowerCase();
          }
        }
      }

      switch (mirror) {
        case "always":
          return true;
        case "never":
          return false;
      }

    }

  }

  public stopMediaTracks() {
    if (this.mediaStream && this.mediaStream.getTracks) {
      this.mediaStream.getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
    }
  }

  private unsubscribeFromSubscriptions() {

    if (this.triggerSubscription) {
      this.triggerSubscription.unsubscribe();
    }
    if (this.switchCameraSubscription) {
      this.switchCameraSubscription.unsubscribe();
    }

    this.subscription.unsubscribe();

  }

  private detectAvailableDevices(): Promise<MediaDeviceInfo[]> {
    return new Promise((resolve, reject) => {
      WebcamUtil.getAvailableVideoInputs()
        .then((devices: MediaDeviceInfo[]) => {
          this.availableVideoInputs = devices;
          resolve(devices);
        })
        .catch(err => {
          this.availableVideoInputs = [];
          reject(err);
        })
    })
  }

}