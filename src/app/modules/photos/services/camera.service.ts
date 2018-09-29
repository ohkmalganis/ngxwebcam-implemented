import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GLOBAL } from './global';
import { Observable } from 'rxjs';
import { Subject, forkJoin } from 'rxjs';

@Injectable()

export class CameraService {

    private subject = new Subject<any>();
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

    sendUpload(file:File)
    {
        let formData: FormData = new FormData();
        let headers = new HttpHeaders();
        formData.append('file', file, file.name);
        return this._http.post(this.url + 'uploads/fotos/upload', formData, { headers: headers });
    }

    takeSnapshotEmmit(code: string)
    {
        this.subject.next({ code: code });
    }

    sendSnapshotEmmit(code: string, file: File)
    {
        let myFile = this.convertDataURItoFile(file);
        this.sendSubject.next({ code: code, file: myFile, URI: file});
    }

    getSnapshot(): Observable<any>
    {
        return this.subject.asObservable();
    }
    
    getSendSnapshot(): Observable<any>
    {
        return this.sendSubject.asObservable();
    }

    private makerandomchar(): string
    {

        var text:string = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 9; i++) 
        {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    convertDataURItoFile(data: any)
    {
        let dataURI = data;
        let extension: string = ".jpg";
        let filewithoutext = this.makerandomchar();
        let fileName = filewithoutext + '' + extension;
        
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);

        for (var i = 0; i < byteString.length; i++) 
        {
            ia[i] = byteString.charCodeAt(i);
        }
        
        var blob = new File([ia], fileName, { type: mimeString });
        return blob;
    }

    beforeProcessing(dato: any) 
    {
        let _files = [];
        let _data = dato;
        Object.keys(_data).map(function (objectKey, index) {
            _files.push(_data[objectKey].file);
        });
        return _files;
    }

    savePhotos(files: Array<File>) 
    {
        let _files = this.beforeProcessing(files);
        let obs = _files.map(elem => {
            return this.sendUpload(elem);
        })
        return forkJoin(obs);
    }
}