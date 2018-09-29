import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraComponent } from './camera/camera.component';
import { UploadComponent } from './upload/upload.component';
import { CameraSrcComponent } from './camera-src/camera-src.component';
import { PhotosComponent } from './photos.component';
import { CameraService } from './services/camera.service';
import { UploadService } from './services/upload.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [CameraComponent, UploadComponent, CameraSrcComponent, PhotosComponent],
  providers: [CameraService, UploadService]
})
export class PhotosModule { }
