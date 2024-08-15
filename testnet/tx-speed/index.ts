
async function run() {
    process.env.custom_cwd = __dirname;
    process.env.nocli = "true";

    const utils = (await import("../../src/utils/index.js")).default;

    //console.log(utils.procCWD);
    if (utils.procCWD !== __dirname) {
        throw new Error("CWD not set correctly!");
    }

    await (await import("../../src/storage/blockchain.js")).default.waitAllinit();


    const count = 10_000;

    console.log(`\nTX Speed Test with ${count.toLocaleString()} Transactions\n`);

    const TXSpeedTest = (await import("./main.js")).TXSpeedTest;

    await TXSpeedTest.init(count);

    await TXSpeedTest.runVerify();
    await TXSpeedTest.runExecute();

    await TXSpeedTest.end();
}

run();
