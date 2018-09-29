import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CameraService } from '../services/camera.service';
import { UploadService } from '../services/upload.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'camera-src',
  template: `
  <div>
  <h5 class="card-title">{{ leyenda }}</h5>
  <div class="col-md-12 m-0 p-0">
    <img [src]="file" width="290px;" height="200px;" (error)="errorHandler($event, code)">
    
    <a *ngIf="camera" class="btn btn-light btn-sm float-right" (click)="takeSnapshot();" class="button-over">T</a>
    <a *ngIf="!camera" class="btn btn-light btn-sm float-right" (click)="uploadPhoto();" class="button-over">U</a>
  </div>
  </div>`,
  styles: [`
    .button-over{
      position: absolute;
      top: 0;
      left: 0;
      z-index:999;
    }
  `]
})
export class CameraSrcComponent implements OnInit, OnDestroy {

  @Input() leyenda: string = 'Perfil';
  @Input() camera: boolean = false;
  @Input() code: string = null;

  public file: any;
  public cameraSrc: Subscription;
  public uploadSrc: Subscription;

  constructor
    (
    private _cameraService: CameraService,
    private _uploadService: UploadService
    ) {
    this.cameraSrc = this._cameraService.getSendSnapshot().subscribe((resp: any) => {
      if (this.code && resp.code == this.code) {
        this.file = resp.URI;
      }
    });

    this.uploadSrc = this._uploadService.getSend().subscribe(resp => {
      if (this.code && resp.code == this.code) {
        this.file = resp.URI;
      }
    });
  }

  ngOnInit() { }

  ngOnDestroy() {
    this.cameraSrc.unsubscribe();
  }

  takeSnapshot(): void {
    this._cameraService.takeSnapshotEmmit(this.code);
  }

  uploadPhoto(): void {
    this._uploadService.getUploadEmmit(this.code);
  }

  errorHandler(event, code) {
    if (code === "pf") {
      event.target.src = "assets/photo/face-front.png";
    }
    if (code === "pi") {
      event.target.src = "assets/photo/face-side-left.png";
    }
    if (code === "pd") {
      event.target.src = "assets/photo/face-side-right.png";
    }
  }

}
