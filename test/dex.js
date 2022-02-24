const {
    expectRevert,
} = require('@openzeppelin/test-helpers');
const Aum = artifacts.require('mocks/Aum.sol');
const Hum = artifacts.require('mocks/Hum.sol');
const Lam = artifacts.require('mocks/Lam.sol');
const Vam = artifacts.require('mocks/Vam.sol');
const Yum = artifacts.require('mocks/Yum.sol');

const Dex = artifacts.require('Dex.sol');

const SIDE = {
    BUY: 0,
    SELL: 1
};

contract('Dex', (accounts) => {
    let dex, aum, hum, lam, vam, yum;
    const [trader1, trader2] = [accounts[1], accounts[2]];
    const [AUM, HUM, LAM, VAM, YUM] = ['AUM', 'HUM', 'LAM', 'VAM', 'YUM']
    .map(ticker => web3.utils.fromAscii(ticker));

    beforeEach(async () => {
        ([aum, hum, lam, vam, yum] = await Promise.all([
            Aum.new(),
            Hum.new(),
            Lam.new(),
            Vam.new(),
            Yum.new()
        ]));
        dex = await Dex.new();
        await Promise.all([
            dex.addToken(AUM, aum.address),
            dex.addToken(HUM, hum.address),
            dex.addToken(LAM, lam.address),
            dex.addToken(VAM, vam.address),
            dex.addToken(YUM, yum.address)
        ]);

        const amount = web3.utils.toWei('1000');
        const seedTokenBalance = async (token, trader) => {
            await token.faucet(trader, amount)
            await token.approve(
                dex.address,
                amount, {
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
    });

    it('should deposit tokens', async () => {
        const amount = web3.utils.toWei('100');
        await dex.deposit(
            amount,
            AUM, {
                from: trader1
            }
        );

        const balance = await dex.traderBalances(trader1, AUM);
        assert(balance.toString() === amount);
    });

    it('should NOT deposit tokens if token does not exist', async () => {
        await expectRevert(
            dex.deposit(
                web3.utils.toWei('100'),
                web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'), {
                    from: trader1
                }
            ),
            'this token does not exist'
        );
    });

    it('should withdraw tokens', async () => {
        const amount = web3.utils.toWei('100');

        await dex.deposit(
            amount,
            AUM, {
                from: trader1
            }
        );

        await dex.withdraw(
            amount,
            AUM, {
                from: trader1
            }
        );

        const [balanceDex, balanceAum] = await Promise.all([
            dex.traderBalances(trader1, AUM),
            aum.balanceOf(trader1)
        ]);
        assert(balanceDex.isZero());
        //  assert(balanceAum.toString() === web3.utils.toWei('1000'));
    });

    it('should NOT withdraw tokens if token does not exist', async () => {
        await expectRevert(
            dex.withdraw(
                web3.utils.toWei('1000'),
                web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'), {
                    from: trader1
                }
            ),
            'this token does not exist'
        );
    });

    it('should NOT withdraw tokens if balance too low', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            AUM, {
                from: trader1
            }
        );

        await expectRevert(
            dex.withdraw(
                web3.utils.toWei('1000'),
                AUM, {
                    from: trader1
                }
            ),
            'balance too low'
        );
    });

    it('should create limit order', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            AUM, {
                from: trader1
            }
        );
        await dex.createLimitOrder(
            HUM,
            web3.utils.toWei('10'),
            10,
            SIDE.BUY, {
                from: trader1
            }
        );
        let buyOrders = await dex.getOrders(HUM, SIDE.BUY);
        let sellOrders = await dex.getOrders(HUM, SIDE.SELL);
        assert(buyOrders.length === 1);
        assert(buyOrders[0].trader === trader1);
        assert(buyOrders[0].ticker === web3.utils.padRight(HUM, 64));
        assert(buyOrders[0].price === '10');
        assert(buyOrders[0].amount === web3.utils.toWei('10'));
        assert(sellOrders.length === 0);

        await dex.deposit(
            web3.utils.toWei('200'),
            AUM, {
                from: trader2
            }
        );

        await dex.createLimitOrder(
            HUM,
            web3.utils.toWei('10'),
            11,
            SIDE.BUY, {
                from: trader2
            }
        );

        buyOrders = await dex.getOrders(HUM, SIDE.BUY);
        sellOrders = await dex.getOrders(HUM, SIDE.SELL);
        assert(buyOrders.length === 2);
        assert(buyOrders[0].trader === trader2);
        assert(buyOrders[1].trader === trader1);
        assert(sellOrders.length === 0);

        await dex.deposit(
            web3.utils.toWei('200'),
            AUM, {
                from: trader2
            }
        );

        await dex.createLimitOrder(
            HUM,
            web3.utils.toWei('10'),
            9,
            SIDE.BUY, {
                from: trader2
            }
        );

        buyOrders = await dex.getOrders(HUM, SIDE.BUY);
        sellOrders = await dex.getOrders(HUM, SIDE.SELL);
        assert(buyOrders.length === 3);
        assert(buyOrders[0].trader === trader2);
        assert(buyOrders[1].trader === trader1);
        assert(buyOrders[2].trader === trader2);
        assert(sellOrders.length === 0);
    });

    it('should NOT create limit order if token balance too low', async () => {
        await dex.deposit(
            web3.utils.toWei('99'),
            AUM, {
                from: trader1
            }
        );

        await expectRevert(
            dex.createLimitOrder(
                HUM,
                web3.utils.toWei('100'),
                10,
                SIDE.SELL, {
                    from: trader1
                }
            ),
            'token balance too low'
        );
    });

    it('should NOT create limit order if AUM balance too low', async () => {
        await dex.deposit(
            web3.utils.toWei('99'),
            AUM, {
                from: trader1
            }
        );

        await expectRevert(
            dex.createLimitOrder(
                HUM,
                web3.utils.toWei('10'),
                10,
                SIDE.BUY, {
                    from: trader1
                }
            ),
            'AUM balance too low'
        );
    });

    it('should NOT create limit order if token is AUM', async () => {
        await expectRevert(
            dex.createLimitOrder(
                AUM,
                web3.utils.toWei('1000'),
                10,
                SIDE.BUY, {
                    from: trader1
                }
            ),
            'cannot trade AUM'
        );
    });

    it('should NOT create limit order if token does not not exist', async () => {
        await expectRevert(
            dex.createLimitOrder(
                web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'),
                web3.utils.toWei('1000'),
                10,
                SIDE.BUY, {
                    from: trader1
                }
            ),
            'this token does not exist'
        );
    });

    it('should create market order & match', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            AUM, {
                from: trader1
            }
        );

        await dex.createLimitOrder(
            HUM,
            web3.utils.toWei('10'),
            10,
            SIDE.BUY, {
                from: trader1
            }
        );

        await dex.deposit(
            web3.utils.toWei('100'),
            HUM, {
                from: trader2
            }
        );

        await dex.createMarketOrder(
            HUM,
            web3.utils.toWei('5'),
            SIDE.SELL, {
                from: trader2
            }
        );

        const balances = await Promise.all([
            dex.traderBalances(trader1, AUM),
            dex.traderBalances(trader1, HUM),
            dex.traderBalances(trader2, AUM),
            dex.traderBalances(trader2, HUM),
        ]);
        const orders = await dex.getOrders(HUM, SIDE.BUY);
        assert(orders.length === 1);
        assert(orders[0].filled = web3.utils.toWei('5'));
        assert(balances[0].toString() === web3.utils.toWei('50'));
        assert(balances[1].toString() === web3.utils.toWei('5'));
        assert(balances[2].toString() === web3.utils.toWei('50'));
        assert(balances[3].toString() === web3.utils.toWei('95'));
    });

    it('should NOT create market order if token balance too low', async () => {
        await expectRevert(
            dex.createMarketOrder(
                HUM,
                web3.utils.toWei('101'),
                SIDE.SELL, {
                    from: trader2
                }
            ),
            'token balance too low'
        );
    });

    it('should NOT create market order if AUM balance too low', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            HUM, {
                from: trader1
            }
        );

        await dex.createLimitOrder(
            HUM,
            web3.utils.toWei('100'),
            10,
            SIDE.SELL, {
                from: trader1
            }
        );

        await expectRevert(
            dex.createMarketOrder(
                HUM,
                web3.utils.toWei('101'),
                SIDE.BUY, {
                    from: trader2
                }
            ),
            'AUM balance too low'
        );
    });

    it('should NOT create market order if token is AUM', async () => {
        await expectRevert(
            dex.createMarketOrder(
                AUM,
                web3.utils.toWei('1000'),
                SIDE.BUY, {
                    from: trader1
                }
            ),
            'cannot trade AUM'
        );
    });

    it('should NOT create market order if token does not not exist', async () => {
        await expectRevert(
            dex.createMarketOrder(
                web3.utils.fromAscii('TOKEN-DOES-NOT-EXIST'),
                web3.utils.toWei('1000'),
                SIDE.BUY, {
                    from: trader1
                }
            ),
            'this token does not exist'
        );
    });
});