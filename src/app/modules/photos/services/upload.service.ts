import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GLOBAL } from './global';
import { Observable } from 'rxjs';
import { Subject, from } from 'rxjs';
import { map } from 'rxjs/operators'

@Injectable()

export class UploadService {

  private sendUploadSubject = new Subject<any>();
  private sendSubject = new Subject<any>();

  public url: string;
  public status: string;
  public photogo: boolean = false;

  constructor
  (
    private _http: HttpClient
  )
  {
    this.url = GLOBAL.url;
  }

  uploadFile(file: File) 
  {
    let formData: FormData = new FormData();
    let headers = new HttpHeaders();
    formData.append('file', file, file.name);
    return this._http.post(this.url + 'uploads/fotos/upload', formData, { headers: headers });
  }

  handleFileInput(files: FileList, event: any): Observable<any> 
  {
    let file = files.item(0);
    let reader = new FileReader();
    reader.onload = this.handleReaderLoaded.bind(this);

    return this.readUrl(event).pipe
    (
      map((url:any) => 
      {
        return {
          file: file,
          URI: url
        };
      })
    );    
  }

  private handleReaderLoaded(file): Observable<any> 
  {
    var binaryString = file.target.result;
    return from(btoa(binaryString));
  }

  readUrl(event: any): Observable<any> 
  {
    return Observable.create((obs:any) => 
    {
      let url:any = null;
      if (event.target.files && event.target.files[0]) 
      {

        var reader = new FileReader();
        reader.onload = (event: ProgressEvent) => 
        {
          url = (<FileReader>event.target).result;
          obs.next(url);
          obs.complete();
        }
        reader.readAsDataURL(event.target.files[0]);
      }
    });
  }

  getUploadEmmit(code) 
  {
    this.sendUploadSubject.next({code:code});
  }

  getSendUpload() 
  {
    return this.sendUploadSubject.asObservable();
  }

  sendUploadEmmit(file, code, URI) 
  {
    this.sendSubject.next({ code: code, file: file, URI: URI});
  }

  getSend() 
  {
    return this.sendSubject.asObservable();
  }

}
