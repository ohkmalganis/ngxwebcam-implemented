import { Component, OnInit } from '@angular/core';
import { UploadService } from '../services/upload.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ng-upload',
  templateUrl: './upload.component.html'
})
export class UploadComponent implements OnInit {

  public fileToUpload: File = null;
  public url: any;
  public code: any;
  public subscription: Subscription;
  constructor
  (
    private _uploadService: UploadService
  ) 
  {
    this.subscription = this._uploadService.getSendUpload().subscribe((resp: any) => {
      this._uploadService.sendUploadEmmit(this.fileToUpload, resp.code, this.url);
    });
  }

  ngOnInit() {}

  handleFileInput(files: FileList, event: any) 
  {
    this._uploadService.handleFileInput(files, event).subscribe((resp:any) => {
      this.fileToUpload = resp.file;
      this.url = resp.URI;
    });    
  }
}
