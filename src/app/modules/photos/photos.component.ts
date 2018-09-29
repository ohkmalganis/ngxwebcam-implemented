import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CameraService } from './services/camera.service';
import { UploadService } from './services/upload.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'tp4-photos',
  templateUrl: './photos.component.html',
  styles: [`
  .mbot-medium{
    margin-bottom: 50px;
  }
  `]
})
export class PhotosComponent implements OnInit, OnDestroy {

  public camera: boolean = true;
  public uses: boolean = true;
  public subscriptionCamera: Subscription;
  public subscriptionUpload: Subscription;
  public static componentes: number = 2;

  @Input() public data: any = {};

  constructor
    (
    private _cameraService: CameraService,
    private _uploadService: UploadService
    ) {
    this.subscriptionCamera = this._cameraService.getSendSnapshot().subscribe((resp: any) => {
      this.data[resp.code] = resp;
    });

    this.subscriptionUpload = this._uploadService.getSend().subscribe((resp: any) => {
      this.data[resp.code] = resp;
    });

  }

  ngOnInit() { }

  ngOnDestroy() {
    this.subscriptionCamera.unsubscribe();
    this.subscriptionUpload.unsubscribe();
  }

  callCamera() {
    this.camera = true;
  }

  callUpload() {
    this.camera = false;
  }

  savePhotos() {
    let _data = this.data;
    this._cameraService.savePhotos(_data).subscribe(resp => console.log(resp));
  }

}
