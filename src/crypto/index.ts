import crypto from "crypto";
import elliptic from 'elliptic';
import { Dict } from "../utils/dataUtils.js";
import { Uint, Uint256 } from "../binary/uint.js";
import { EllipticBinarySignature, Signature } from "../objects/signature.js";
import { PrivateKey, PublicKey } from "./cryptoKeys.js";
import { PX } from "../objects/prefix.js";

export class LCrypt {

    static readonly ec = new elliptic.ec("secp256k1");

    static sha256(input: Uint | Buffer) {
        return new Uint256(
            crypto.createHash('sha256').update(
                input instanceof Uint ? input.getRaw() : input
            ).digest()
        );
    }

    static sign(hash: Uint256, signerType: PX, privateKey: PrivateKey) {
        try {
            const keyPair = this.ec.keyFromPrivate(privateKey.getRaw());
            const signature = keyPair.sign(hash.getRaw());
            return Signature.fromElliptic(signerType, (signature as EllipticBinarySignature));
        } catch (error: any) {
            return Signature.alloc();
        }
    }

     static getPublicKeyFromPrivateKey(privateKey: PrivateKey) {
        try {
            return PublicKey.from(this.ec.keyFromPrivate(privateKey.getRaw()).getPublic(true, "array"));
        } catch (error: any) {
            return PublicKey.empty();
        }
    }

    static getPublicKeyFromSignature(hash: Uint256, signature: Signature) {
        try {
            return PublicKey.from((this.ec.recoverPubKey(
                hash.getRaw(),
                signature.getElliptic(),
                signature.getRecoveryParam()
            ) as elliptic.curve.base.BasePoint).encode("array", true));
        } catch (error: any) {
            return PublicKey.empty();
        }
    }

     static getPreparedObjectForHashing(obj: Dict<any>, excludedKeys: string[] = []): Dict<any> {
        const deepSort = (input: any): any => {
            if (typeof input !== 'object' || input === null) {
                return input;
            }

            if (Array.isArray(input)) {
                return input.map(deepSort);
            }

            const sortedObj: Dict<any> = {};
            Object.keys(input)
                .sort()
                .forEach(key => {
                    if (!excludedKeys.includes(key)) {
                        sortedObj[key] = deepSort(input[key]);
                    }
                });
            return sortedObj;
        };

        const sortedObj = deepSort(obj);
        return sortedObj;
    }


    static randomBytes(length: number) {
        return crypto.randomBytes(length);
    }

    static generatePrivateKey() {
        return new PrivateKey(this.ec.genKeyPair().getPrivate().toBuffer());
    }
}

export default LCrypt;
