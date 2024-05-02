import { DatabaseOptions, Level } from "level";
import { BinaryEncoder } from "../encoding/binaryEncoder.js";
import { Uint } from "../utils/binary.js";

export class LevelDB<K = Uint, V = Uint> extends Level<K, V> {
    
    constructor(location: string, options?: DatabaseOptions<K, V> | string);
    constructor(location: string, options: DatabaseOptions<any, any> = {
        keyEncoding: BinaryEncoder,
        valueEncoding: BinaryEncoder
    }) {
        super(location, options);
    }

}

export default LevelDB;