import { BasicBinaryMap, Uint256, Uint32 } from "low-level";
import { BE, DataEncoder } from "../../../encoding/binaryEncoders.js";
import { type PeerSocket } from "../../socket.js";
import { LNMsgDefaultHandler, LNMsgRequestHandler } from "../abstractMsgHandler.js";
import { LNAbstractMsgBody, LNMsgID } from "../abstractMsg.js";
import LCrypt from "../../../crypto/index.js";
import { Deferred } from "../../../utils/deferred.js";
import Schedule from "../../../utils/schedule.js";

class ChallengeMsgStoreItem {
    constructor(
        readonly result = new Deferred<Uint256 | null>(),
        readonly timeout = new Schedule(() => {
            this.result.resolve(null);
        }, 5_000)
    ) {}

    public resolve(challenge: Uint256) {
        this.timeout.cancel();
        this.result.resolve(challenge);
    }

    public awaitResult() {
        return this.result.awaitResult();
    }
}

export class ChallengeMsgStore {

    private static readonly store = new BasicBinaryMap<Uint32, ChallengeMsgStoreItem>(Uint32);

    static add(id: Uint32) {
        const data = new ChallengeMsgStoreItem();
        this.store.set(id, data);
        return data;
    }

    static get(id: Uint32) {
        return this.store.get(id);
    }

    static delete(id: Uint32) {
        this.store.delete(id);
    }

}


export class ChallengeMsg extends LNAbstractMsgBody {

    constructor(
        readonly requestID: Uint32,
        readonly challenge: Uint256
    ) {super()}

    static create(requestID: Uint32) {
        return new ChallengeMsg(requestID, new Uint256(LCrypt.randomBytes(32)));
    }

    protected static fromDict(obj: Dict<any>) {
        return new ChallengeMsg(obj.id, obj.challenge);
    }

    protected static readonly encodingSettings: DataEncoder[] = [
        BE(Uint32, "requestID"),
        BE(Uint256, "challenge")
    ]
}

export namespace ChallengeMsg {
    export const ID = LNMsgID.from("77a9"); // CHALLENGE

    export const Handler = new class Handler extends LNMsgDefaultHandler {
        async receive(data: ChallengeMsg, socket: PeerSocket) {
            
            const challenge = ChallengeMsgStore.get(data.requestID);
            if (challenge) {
                challenge.resolve(data.challenge);
                socket.close();
                return;
            }

            const request = socket.activeRequests.get(data.requestID);
            if (request) {
                request.resolve(data);
                return;
            }
        }
    }
}


export class ChallengeREQMsg extends LNAbstractMsgBody {
    protected static fromDict() {
        return new ChallengeREQMsg();
    }
}

export namespace ChallengeREQMsg {
    export const ID = LNMsgID.from("77a9"); // CHALLENGE

    export const Handler = new class Handler extends LNMsgRequestHandler {
        async receive(data: ChallengeREQMsg, socket: PeerSocket, requestID: Uint32) {
            const result = await ChallengeMsgStore.add(requestID).awaitResult();
            ChallengeMsgStore.delete(requestID);
            
            if (!result) {
                return null;
            }
            return new ChallengeMsg(requestID, result);
        }
    }
}

