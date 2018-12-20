import excel from '../excelRequestExample'
import { saveAs } from 'file-saver';

export class requestService {
    url = '/datacloud/snapshot/rest/v2/select';
    excelUrl = '/Apps/ExcelExport/1.5.7/JsonToExcel';
    userUrl = '/Apps/ResearchAdminAPI/1.14.6/currentUserInfo/';

    sendRequest = request => {
        const searchParams = () => {
            console.log('request', request);
            const temp = [];
                Object.keys(request).forEach(key => temp.push([encodeURIComponent(key), encodeURIComponent(request[key])].join('=')));
                return temp.join('&');
        };
        return fetch(this.url, {
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            credentials: 'same-origin',
            method: 'POST',
            body: searchParams()
        })
            .then(data => data.json())
            .catch(err => console.log(err));
    };

    postExcel = () => {
        return fetch(this.excelUrl, {
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            method: 'POST',
            body: JSON.stringify(excel)
        })
            .then(res => res.blob())
            .then(res => {
                console.log(res);
                const file = new Blob([res], { type: 'arraybuffer' });
                saveAs(file,'azaza1.xlsx');
            })

    };

    fetchUserById = id => {
        return fetch(this.userUrl, {
            headers: {
                'reutersUuid': '1',
                'appId': '1',
            },
            credentials: 'same-origin',
            method: 'GET'
        })
            .then(res => res.json())
            .then(response => console.log(response))
            .catch(err => console.log(err))
    }
}