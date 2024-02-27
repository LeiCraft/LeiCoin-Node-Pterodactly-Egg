import blockchain from "../../handlers/storage/blockchain.js";
import mempool from "../../handlers/storage/mempool.js";
import Block from "../../objects/block.js";
import cli from "../../utils/cli.js";
import utils from "../../utils/utils.js";
import validation from "../../validation.js";

export default function (data: any) {

	const block = utils.createInstanceFromJSON(Block, data);

	if (!blockchain.checkNewBlockExisting(block.index, block.hash).cb) {

		const validationresult = validation.isValidBlock(block);

		if (validationresult.cb) {

			if (validationresult.forktype = "newfork") {
				blockchain.createFork(validationresult.forkchain);
			}

			blockchain.addBlock(block, validationresult.forkchain);
			blockchain.updateLatestBlockInfo(
				validationresult.forkchain,
				block,
				validationresult.forkparent
			);
			mempool.clearMempoolbyBlock(block);
	
			for (const transactionData of block.transactions) {
				blockchain.deleteUTXOS(transactionData);
				blockchain.addUTXOS(transactionData);
			}
	
			cli.leicoin_net_message.server.success(`Received block with hash ${block.hash} has been validated. Adding to Blockchain.`);
		} else {
			cli.leicoin_net_message.server.error(`Received block with hash ${block.hash} is invalid. Error: ${JSON.stringify(validationresult)}`);
		}

		return validationresult;
	}

	return {cb: false};

}
