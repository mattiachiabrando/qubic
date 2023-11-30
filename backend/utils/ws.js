export class AsyncWebSocket {
    constructor(socket) {
        this.socket = socket;
    }

    send(data) {
        return this.socket.send(data);
    }

    receive() {
        return new Promise((resolve, reject) => {
            this.socket.once('message', event => {
                try {
                    resolve(event.toString());
                } catch (error) {
                    reject(error);
                }
            });
            this.socket.once('error', reject);
        });
    }

    close(code, reason) {
        return new Promise((resolve, reject) => {
            this.socket.close(code, reason);
            this.socket.once('close', resolve);
            this.socket.once('error', reject);
        });
    }
}
