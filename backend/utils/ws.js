export class WebSocketClient {
    constructor(client) {
        this.client = client;
    }

    send(data) {
        return new Promise((resolve, reject) => {
            this.client.send(data, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    receive() {
        return new Promise((resolve, reject) => {
            this.client.once('message', resolve);
            this.client.once('error', reject);
        });
    }
}
