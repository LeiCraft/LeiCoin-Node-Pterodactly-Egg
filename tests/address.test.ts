import Crypto from "../src/crypto/index.js"
import Address from "../src/objects/address.js";

describe('address_testing', () => {
    test('address_enoding_and_decoding', () => {

        const privateKeyHex = "c2c53b8c95f84438d86ccabd9985651afdf8fe1307f691681f9638ff04bf9caa";
        const address = Address.fromPrivateKey("00", privateKeyHex);

        const hashData = Crypto.sha256("0123456789abcdef", [], "buffer");

        const signature = Crypto.sign(hashData, "00", privateKeyHex);
        const recoveredAddress = Address.fromSignature(hashData, (signature as string));

        expect((address === recoveredAddress) ? address : null).toBe("lc0x1e4dd45874ec12bad77ac350369ca819e4f12f");
    });
    test('coinbase_address_gettting', () => {

        const privateKeyHex = new Array<string>(32).fill("00").join("");
        const address = Address.fromPrivateKey("00", privateKeyHex);

        expect(address).toBe("lc0xe3b0c44298fc1c149afbf4c8996fb92427ae41");
    });
});