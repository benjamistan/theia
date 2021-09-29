require('dotenv').config();
import { providers, Wallet } from 'ethers';
import { FlashbotsBundleProvider } from '@flashbots/ethers-provider-bundle';

const CHAIN_ID = 5; // choosing our chain
const provider = new providers.InfuraProvider(CHAIN_ID); // setting up the Ethers Infura provider

const FLASHBOTS_ENDPOINT = 'https://relay-goerli.flashbots.net'; // setting up our flashbots endpoint. We send our bundles here

if (process.env.WALLET_PRIVATE_KEY === undefined) {
	// error checking to ensure we have a Wallet private key
	console.error('Please provide WALLET_PRIVATE_KEY env');
	process.exit(1);
}

const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider); // creating our default wallet using Ethers

// ethers.js can use Bignumber.js class OR the JavaScript-native bigint. I changed this to bigint as it is MUCH easier to deal with
const GWEI = 10n ** 9n; // Number helper for Gwei
const ETHER = 10n ** 18n; // Number helper for Ether

async function main() {
	// our main function
	const flashbotsProvider = await FlashbotsBundleProvider.create(
		// creating our flashbots provider using our globals above
		provider,
		wallet,
		FLASHBOTS_ENDPOINT
	);

	const blockNumber = await provider.getBlockNumber(); // getting block number
	const minTimestamp = (await provider.getBlock(blockNumber)).timestamp; // getting block timestamp
	console.log(
		// logging our start time in human-readable format
		new Date().toLocaleString(),
		'- minTimestamp:',
		new Date(minTimestamp * 1000).toLocaleString()
	);
	const maxTimestamp = minTimestamp + 120; // getting our end time
	console.log(
		// logging our start time in human-readable format
		new Date().toLocaleString(),
		'- maxTimestamp:',
		new Date(maxTimestamp * 1000).toLocaleString()
	);

	provider.on('block', async (blockNumber) => {
		// each time provider has a new block, we do this
		console.log(new Date().toLocaleString(), '- Latest block is', blockNumber); // log block number
		//console.log('Wallet in flashbots provider is: ', wallet.address);

		// To-do: get gas price

		const bundleSubmitResponse = await flashbotsProvider.sendBundle(
			// send our bundle to Flashbot for generating tx to the NFT minter
			[
				{
					transaction: {
						chainId: CHAIN_ID,
						type: 2,
						value: (ETHER / 100n) * 3n,
						data: '0x1249c58b',
						maxFeePerGas: GWEI * 3n,
						maxPriorityFeePerGas: GWEI * 2n,
						to: '0x20EE855E43A7af19E407E39E5110c2C1Ee41F64D',
					},
					signer: wallet,
				},
			],
			blockNumber + 1
		);
		//console.log('Bundle submitted');
		console.log(
			// logging out our bundle
			new Date().toLocaleString(),
			'Bundle submitted:',
			bundleSubmitResponse
		);

		// By exiting this function (via return) when the type is detected as a "RelayResponseError", TypeScript recognizes bundleSubmitResponse must be a success type object (FlashbotsTransactionResponse) after the if block.
		if ('error' in bundleSubmitResponse) {
			// logging out any errored bundles
			console.warn(
				new Date().toLocaleString(),
				bundleSubmitResponse.error.message
			);
			return;
		}

		// console.log(
		// 	'Simulated Bundle Response:',
		// 	await bundleSubmitResponse.simulate()                                       // simulating our bundle response
		// );
	});
}

main();
