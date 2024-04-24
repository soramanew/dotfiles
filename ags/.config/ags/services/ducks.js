const { Gio, GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

const USER_CACHE_DIR = GLib.get_user_cache_dir();

function paramStringFromObj(params) {
    return Object.entries(params)
        .map(([key, value]) => {
            if (Array.isArray(value)) { // If it's an array, repeat
                if (value.length == 0) return '';
                let thisKey = `${encodeURIComponent(key)}=${encodeURIComponent(value[0])}`
                for (let i = 1; i < value.length; i++) {
                    thisKey += `&${encodeURIComponent(key)}=${encodeURIComponent(value[i])}`;
                }
                return thisKey;
            }
            return `${key}=${value}`;
        })
        .join('&');
}

class DuckService extends Service {
    _headers = {}
    _baseUrl = 'https://random-d.uk/api/v2/random';
    _responses = [];
    _queries = [];
    _minHeight = 600;
    _status = 0;

    static {
        Service.register(this, {
            'initialized': [],
            'clear': [],
            'newResponse': ['int'],
            'updateResponse': ['int'],
        });
    }

    constructor() {
        super();
        this.emit('initialized');
    }

    clear() {
        this._responses = [];
        this._queries = [];
        this.emit('clear');
    }

    get queries() { return this._queries }
    get responses() { return this._responses }

    async fetch() {
        const newMessageId = this._queries.length;
        this._queries.push(null);
        this.emit('newResponse', newMessageId);
        const params = {
            type: "jpg",
        };
        const paramString = paramStringFromObj(params);
        // Fetch
        // Note: body isn't included since passing directly to url is more reliable
        const options = { 
            method: 'GET',
            headers: this._headers,
        };
        var status = 0;
        Utils.fetch(`${this._baseUrl}?${paramString}`, options)
            .then(result => {
                status = result.status;
                return result.text();
            })
            .then((dataString) => { // Store interesting stuff and emit
                const parsedData = JSON.parse(dataString);
                if (!parsedData.url) this._responses.push({
                    status: status,
                    url: '',
                    extension: '',
                    signature: 0,
                    source: '',
                    dominant_color: '#383A40',
                    width: 0,
                    height: 0,
                });
                else {
                    const url = parsedData.url;
                    const extension = "." + url.split(".").at(-1);
                    const signature = url.split("/").at(-1).split(".")[0];
                    Utils.execAsync(`bash -c 'pic="${USER_CACHE_DIR}/ags/media/ducks/${signature}${extension}" && wget -q -O "$pic" "${url}" && identify -format "%w %h" "$pic"'`).then(out => {
                        const size = out.split(" ");
                        this._responses.push({
                            status: status,
                            url: url,
                            extension: extension,
                            signature: signature,
                            source: url,
                            dominant_color: '#9392A6',
                            width: size[0] || 0,
                            height: size[1] || 0,
                        });
                        this.emit('updateResponse', newMessageId);
                    });
                }
            })
            .catch(print);

    }
}

export default new DuckService();

