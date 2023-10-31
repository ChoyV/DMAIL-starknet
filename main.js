import { Provider, Account, CallData, shortString } from "starknet";
import { generate } from 'random-words';
import fs from "fs";
import dotenv from 'dotenv';
import {ethers, formatUnits} from 'ethers';
import cli from "cli";
dotenv.config()
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////// VARS
const contractAddress_1 = '0x0454f0bd015e730e5adbb4f080b075fdbf55654ff41ee336203aa2e1ac4d4309';
const provider = new Provider({
    sequencer: { baseUrl: "https://alpha-mainnet.starknet.io" },
});
const provider2 = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
const domain = ['gmail.com', 'hotmail.com', 'rambler.ru', 'mail.ru', 'yandex.ru'];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////// GAS CHECKER
async function getBaseGas() {
    const { gasPrice } = await provider2.getFeeData();
    return formatUnits(gasPrice, "gwei");
  }

  
  async function waitGas() {
    while (true) {
        const gas = parseInt(await getBaseGas());
        console.log(`L1 gas : ${gas}`);
        if (gas > parseInt(process.env.MAX_GAS_GWEI)) {
            console.log(`Gas price is higher than ${process.env.MAX_GAS_GWEI} GWEI, waiting 1 minute`);
            await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            console.log("=============");
        } else {
            console.log("Gas price is acceptable. Continuing...");
            break;
        }
    }
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////// RANDOM DOMAIN
async function getRandomDomain() {
    const randIndex = Math.floor(Math.random() * domain.length);
    return domain[randIndex];
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////// DELAY (between accs and TX's)
async function timeout() {
    const maxDelay = parseInt(process.env.MAX, 10); // Parse the MAX environment variable as an integer
    const minDelay = parseInt(process.env.MIN, 10); // Parse the MIN environment variable as an integer
    const delayTime = Math.floor(Math.random() * (maxDelay * 60000 - minDelay * 60000 + 1) + minDelay * 60000);
    console.log(`Waiting for ${delayTime / 60000} minutes...`);
    await new Promise(resolve => setTimeout(resolve, delayTime));
}

async function timeoutRepeat() {
    const maxDelay = parseInt(process.env.MAXBETWEEN, 10); // Parse the MAX environment variable as an integer
    const minDelay = parseInt(process.env.MINBETWEEN, 10); // Parse the MIN environment variable as an integer
    const delayTime = Math.floor(Math.random() * (maxDelay * 60000 - minDelay * 60000 + 1) + minDelay * 60000);
    console.log(`Waiting for ${delayTime / 60000} minutes... between TXs`);
    await new Promise(resolve => setTimeout(resolve, delayTime));
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////// Randomize TX's number for each account
async function numberRepeat() {
    const maxDelay = parseInt(process.env.MAX_NUMBER_REPEAT, 10); // Parse the MAX environment variable as an integer
    const minDelay = parseInt(process.env.MIN_NUMBER_REPEAT, 10); // Parse the MIN environment variable as an integer
    const repeats = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
    return repeats;
}



async function actual (accountAddress,privateKey) {
            const emailObject = await generate({ exactly: 1 });
            const email = emailObject[0] + '@' + await getRandomDomain();
            
            const account = new Account(provider, accountAddress, privateKey);
            
            const multiCall = await account.execute({
                contractAddress: contractAddress_1,
                entrypoint: "transaction",
                calldata: CallData.compile({
                    to: shortString.encodeShortString(email),
                    theme: shortString.encodeShortString(generate({ min: 2, max: 3, join: " " }))
                }),
            });
            
            const receipt = await provider.waitForTransaction(multiCall.transaction_hash);
            
            if (receipt && receipt.transaction_failure_reason) {
                console.log('ERROR ->', receipt.transaction_failure_reason);
            } else {
                console.log('SUCCESS -> TX hash:', receipt.transaction_hash);
            }}
            
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////// MAIN FUNC
async function send() {
    const keyPairs = fs.readFileSync("keyPairs.txt", "utf8").split("\n");
    
    for (const pair of keyPairs) {
        const [accountAddress, privateKey] = pair.split(":");
        await waitGas();
        console.log(`Starting account: ${accountAddress}`);
        
        try {
            let actualRepeat = await numberRepeat();
            console.log (`${actualRepeat} TXs `);
            for (let t = 0 ;t <= actualRepeat;t++) {
            actual (accountAddress,privateKey);
            t++;
            if (t < actualRepeat) {
            await timeoutRepeat ()
            }
            }
            await timeout();

        } catch (error) {
            console.log(`Error: ${error.message}`);
            console.log('---------------------------');
            console.log('Going to the next one');
            continue;
        }
    }
    console.log ('---COMPLETED!---')
}

send();
