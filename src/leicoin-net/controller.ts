import { type Uint, Uint16, Uint32 } from "low-level";
import LeiCoinNetNode from "./index.js";
import { type LNBroadcastMsg, LNStandartMsg } from "./messaging/netPackets";
import { type PeerSocket } from "./socket.js";
import { Port } from "../objects/netinfo.js";
import { StatusMsg } from "./messaging/messages/status.js";
import { LNActiveRequest } from "./requests.js";
import { ChallengeREQMsg } from "./messaging/messages/challenge.js";


export class LNController {

    static async broadcast(data: LNBroadcastMsg | Uint) {
        for (const connection of LeiCoinNetNode.connections.values()) {
            connection.send(data);
        }
    }

}

export class PeerSocketController {

    private static async sendStatusMsg(socket: PeerSocket) {
        /** @todo Implment Protocol Versioning Later which will replace Uint16.from(0) */
        return socket.send(new LNStandartMsg(
            new StatusMsg(
                Uint16.from(0),
                Port.from(LeiCoinNetNode.getServerInfo().port)
            )
        ));
    }

    private static verifyRemoteStatus(remoteStatus: StatusMsg | undefined) {
        if (
            remoteStatus &&
            /** @todo Implment Protocol Versioning Later which will replace remoteStatus.version.eq(0) */
            remoteStatus.version.eq(0)
        ) {
            return true;
        }
        return false;
    }

    static async onConnectionInit(socket: PeerSocket) {
        await this.accomplishHandshake(socket);
        socket.send(new LNStandartMsg(ChallengeREQMsg.create()));
    }

    private static async accomplishHandshake(socket: PeerSocket) {

        if (socket.type === "OUTGOING") {
            await this.sendStatusMsg(socket);
        }

        const request = socket.activeRequests.add(new LNActiveRequest<StatusMsg>(Uint32.from(0)));

        socket.state = "READY";

        const remoteStatus = (await request.awaitResult()).data;
        socket.activeRequests.delete(request.id);

        if (!this.verifyRemoteStatus(remoteStatus)) {
            socket.close();
            return;
        }

        if (socket.type === "INCOMING") {
            await this.sendStatusMsg(socket);
        }

    }

}

