export class WebcamUtil
{
    public static getAvailableVideoInputs(): Promise<MediaDeviceInfo[]>
    {
        if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
        {
            return Promise.reject("enumerateDevices() no soportado.");
        }

        return new Promise((resolve, reject) => 
        {
            navigator.mediaDevices.enumerateDevices()
            .then((devices: MediaDeviceInfo[]) => 
            {
                resolve(devices.filter((device: MediaDeviceInfo) => device.kind === 'videoinput'));
            })
            .catch(err => 
            {
                reject(err.message || err);
            })
        })
    }
}