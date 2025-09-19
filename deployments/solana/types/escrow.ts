/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/escrow.json`.
 */
export type Escrow = {
  "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  "metadata": {
    "name": "escrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Token sale escrow program for secure, automated token sales"
  },
  "instructions": [
    {
      "name": "buyTokens",
      "docs": [
        "Buy tokens from the sale with comprehensive security checks"
      ],
      "discriminator": [
        189,
        21,
        230,
        133,
        247,
        2,
        110,
        42
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenSale",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  115,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "token_sale.seller",
                "account": "tokenSale"
              },
              {
                "kind": "account",
                "path": "token_sale.token_mint",
                "account": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "buyerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "buyerPaymentAccount",
          "writable": true
        },
        {
          "name": "sellerPaymentAccount",
          "writable": true
        },
        {
          "name": "platformFeeAccount",
          "writable": true
        },
        {
          "name": "buyerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "tokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "cancelSale",
      "docs": [
        "Cancel sale and return unsold tokens to seller"
      ],
      "discriminator": [
        82,
        137,
        56,
        136,
        94,
        9,
        205,
        10
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenSale",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  115,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "token_sale.seller",
                "account": "tokenSale"
              },
              {
                "kind": "account",
                "path": "token_sale.token_mint",
                "account": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "sellerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createBuyerAccount",
      "docs": [
        "Create a buyer tracking account (first-time buyers only)"
      ],
      "discriminator": [
        146,
        177,
        98,
        169,
        111,
        176,
        159,
        72
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenSale"
        },
        {
          "name": "buyerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              },
              {
                "kind": "account",
                "path": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeSale",
      "docs": [
        "Initialize a new token sale with production security features"
      ],
      "discriminator": [
        208,
        103,
        34,
        154,
        179,
        6,
        125,
        208
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenSale",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  115,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "paymentMint"
        },
        {
          "name": "sellerTokenAccount",
          "writable": true
        },
        {
          "name": "tokenVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "tokenSale"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "pricePerToken",
          "type": "u64"
        },
        {
          "name": "totalTokens",
          "type": "u64"
        },
        {
          "name": "saleStartTime",
          "type": "i64"
        },
        {
          "name": "saleEndTime",
          "type": "i64"
        },
        {
          "name": "maxTokensPerBuyer",
          "type": "u64"
        },
        {
          "name": "platformFeeBps",
          "type": "u16"
        },
        {
          "name": "platformFeeRecipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "togglePause",
      "docs": [
        "Emergency pause/unpause functionality (seller only)"
      ],
      "discriminator": [
        238,
        237,
        206,
        27,
        255,
        95,
        123,
        229
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenSale",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  115,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "token_sale.seller",
                "account": "tokenSale"
              },
              {
                "kind": "account",
                "path": "token_sale.token_mint",
                "account": "tokenSale"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "updateSaleParams",
      "docs": [
        "Update sale parameters (seller only, before sale starts)"
      ],
      "discriminator": [
        86,
        207,
        77,
        222,
        26,
        93,
        187,
        111
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenSale",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  115,
                  97,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "token_sale.seller",
                "account": "tokenSale"
              },
              {
                "kind": "account",
                "path": "token_sale.token_mint",
                "account": "tokenSale"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newPricePerToken",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "newSaleStartTime",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "newSaleEndTime",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "newMaxTokensPerBuyer",
          "type": {
            "option": "u64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "buyerAccount",
      "discriminator": [
        132,
        99,
        140,
        101,
        194,
        67,
        194,
        66
      ]
    },
    {
      "name": "tokenSale",
      "discriminator": [
        124,
        108,
        99,
        6,
        247,
        132,
        120,
        233
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "saleNotActive",
      "msg": "Sale is not active"
    },
    {
      "code": 6001,
      "name": "insufficientTokens",
      "msg": "Insufficient tokens available"
    },
    {
      "code": 6002,
      "name": "mathOverflow",
      "msg": "Math overflow"
    },
    {
      "code": 6003,
      "name": "invalidPrice",
      "msg": "Invalid price: must be greater than zero"
    },
    {
      "code": 6004,
      "name": "invalidTokenAmount",
      "msg": "Invalid token amount: must be greater than zero"
    },
    {
      "code": 6005,
      "name": "invalidStartTime",
      "msg": "Invalid start time: must be greater than zero"
    },
    {
      "code": 6006,
      "name": "invalidEndTime",
      "msg": "Invalid end time: must be after start time"
    },
    {
      "code": 6007,
      "name": "saleEndTimeInPast",
      "msg": "Sale end time cannot be in the past"
    },
    {
      "code": 6008,
      "name": "saleNotStarted",
      "msg": "Sale has not started yet"
    },
    {
      "code": 6009,
      "name": "saleEnded",
      "msg": "Sale has ended"
    },
    {
      "code": 6010,
      "name": "salePaused",
      "msg": "Sale is currently paused"
    },
    {
      "code": 6011,
      "name": "exceedsPurchaseLimit",
      "msg": "Purchase exceeds per-buyer limit"
    },
    {
      "code": 6012,
      "name": "invalidPlatformFee",
      "msg": "Invalid platform fee: must be 10000 basis points or less"
    },
    {
      "code": 6013,
      "name": "saleAlreadyStarted",
      "msg": "Sale has already started, cannot modify parameters"
    }
  ],
  "types": [
    {
      "name": "buyerAccount",
      "docs": [
        "Account to track individual buyer purchases"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "tokenSale",
            "type": "pubkey"
          },
          {
            "name": "tokensPurchased",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "tokenSale",
      "docs": [
        "Account structure for token sale state"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "paymentMint",
            "type": "pubkey"
          },
          {
            "name": "pricePerToken",
            "type": "u64"
          },
          {
            "name": "totalTokens",
            "type": "u64"
          },
          {
            "name": "tokensAvailable",
            "type": "u64"
          },
          {
            "name": "saleStartTime",
            "type": "i64"
          },
          {
            "name": "saleEndTime",
            "type": "i64"
          },
          {
            "name": "maxTokensPerBuyer",
            "type": "u64"
          },
          {
            "name": "platformFeeBps",
            "type": "u16"
          },
          {
            "name": "platformFeeRecipient",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
