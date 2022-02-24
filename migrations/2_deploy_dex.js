const Dex = artifacts.require("Dex.sol");
const Aum = artifacts.require('mocks/Aum.sol');
const Hum = artifacts.require('mocks/Hum.sol');
const Lam = artifacts.require('mocks/Lam.sol');
const Vam = artifacts.require('mocks/Vam.sol');
const Yum = artifacts.require('mocks/Yum.sol');

const [AUM, HUM, LAM, VAM, YUM] = ['AUM', 'HUM', 'LAM', 'VAM', 'YUM']
.map(ticker => web3.utils.fromAscii(ticker));

const SIDE = {
    BUY: 0,
    SELL: 1
};


module.exports = async function(deployer, _network, accounts) {
    const [trader1, trader2, trader3, trader4, _] = accounts;
    await Promise.all([Dex, Aum, Hum, Lam, Vam, Yum].map(contract => deployer.deploy(contract)));

    const [dex, aum, hum, lam, vam, yum] = await Promise.all([Dex, Aum, Hum, Lam, Vam, Yum]
        .map(contract => contract.deployed()));

    await Promise.all([
        dex.addToken(AUM, aum.address),
        dex.addToken(HUM, hum.address),
        dex.addToken(LAM, lam.address),
        dex.addToken(VAM, vam.address),
        dex.addToken(YUM, yum.address)
    ]);

    const amount = web3.utils.toWei('100000');
    const seedTokenBalance = async (token, trader) => {
        await token.faucet(trader, amount)
        await token.approve(
            dex.address,
            amount, {
                from: trader
            }
        );
        const ticker = await token.name();
        await dex.deposit(
            amount,
            web3.utils.fromAscii(ticker), {
                from: trader
            }
        );
    };
    await Promise.all(
        [aum, hum, lam, vam, yum].map(
            token => seedTokenBalance(token, trader1)
        )
    );
    await Promise.all(
        [aum, hum, lam, vam, yum].map(
            token => seedTokenBalance(token, trader2)
        )
    );
    await Promise.all(
        [aum, hum, lam, vam, yum].map(
            token => seedTokenBalance(token, trader3)
        )
    );
    await Promise.all(
        [aum, hum, lam, vam, yum].map(
            token => seedTokenBalance(token, trader4)
        )
    );

    const increaseTime = async (seconds) => {
        await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [seconds],
            id: 0,
        }, () => {});
        await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: 0,
        }, () => {});
    }



    //create trades
    await dex.createLimitOrder(HUM, 1000, 10, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(HUM, 1000, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(HUM, 1200, 11, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(HUM, 1200, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(LAM, 1200, 15, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(LAM, 1200, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(VAM, 1500, 14, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(VAM, 1500, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(YUM, 2000, 12, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(YUM, 2000, SIDE.SELL, {
        from: trader2
    });

    await dex.createLimitOrder(YUM, 1000, 2, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(YUM, 1000, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(HUM, 500, 4, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(HUM, 500, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(VAM, 800, 2, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(VAM, 800, SIDE.SELL, {
        from: trader2
    });
    await increaseTime(1);
    await dex.createLimitOrder(LAM, 1200, 6, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(LAM, 1200, SIDE.SELL, {
        from: trader2
    });

    await increaseTime(1);
    await dex.createLimitOrder(LAM, 2300, 6, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(LAM, 2300, SIDE.SELL, {
        from: trader2
    });

    await increaseTime(1);
    await dex.createLimitOrder(YUM, 1200, 6, SIDE.BUY, {
        from: trader1
    });
    await dex.createMarketOrder(YUM, 1200, SIDE.SELL, {
        from: trader2
    });

};