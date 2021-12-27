import * as BinaryUtils from "../src/BinaryUtils";
import * as bigInt from "big-integer/BigInteger";
import {Asn, IPNumType} from "../src";
import {intLog2, leftPadWithZeroBit, matchingBitCount} from "../src/BinaryUtils";
import fc from "fast-check"
import {decimalAndBinary, ipv4DecimalNotation} from "./arbitraties/BinaryArbitraties";
import {min} from "big-integer";

describe('Binary Utils', () => {
    fit('Should correctly convert decimal to binary', () => {
        fc.assert(fc.property(decimalAndBinary, (value) => {
            expect(BinaryUtils.decimalNumberToBinaryString(value.value)).toEqual(value.binary);
        }));
    });
    fit('Should correctly parse binary string to a number in BigInteger', () => {
        fc.assert(fc.property(decimalAndBinary, (value) => {
            expect(BinaryUtils.parseBinaryStringToBigInteger(value.binary)).toEqual(bigInt(value.value));
        }));
    });
    fit('Should correctly convert binary to decimal', () => {
        fc.assert(fc.property(decimalAndBinary, (value) => {
            expect(BinaryUtils.parseBinaryStringToBigInteger(value.binary).valueOf()).toEqual(value.value);
        }));
    });
    fit('Should correctly convert a big integer number to binary string', () => {
        fc.assert(fc.property(decimalAndBinary, (value) => {
            expect(BinaryUtils.bigIntegerNumberToBinaryString(bigInt(value.value))).toEqual(value.binary);
        }));
    });
    fit('Should correctly convert binary to decimal and back to binary', () => {
        fc.assert(fc.property(decimalAndBinary, (value) => {
            expect(
                BinaryUtils.decimalNumberToBinaryString(
                    BinaryUtils.parseBinaryStringToBigInteger(value.binary).valueOf()
                )
            ).toEqual(value.binary);
        }));
    });
    fit('Should correctly convert decimal number to octets', () => {
        fc.assert(fc.property(decimalAndBinary.filter(value => {
            return value.binary.length <= 8;
        }).map(value => {
            return {
                binary: leftPadWithZeroBit(value.binary, 8),
                value: value.value
            }
        }), (value) => {
            expect(BinaryUtils.decimalNumberToOctetString(value.value)).toEqual(value.binary);
        }));
    });
    fit('Should throw an exception when converting to octet and value is larger than an octet', () => {
        expect(() => {
            BinaryUtils.decimalNumberToOctetString(122222222222);
        }).toThrowError(Error, 'Given decimal in binary contains digits greater than an octet');
    });
    fit('Should correctly convert IP number in dotted decimal notation to binary string', () => {
        fc.assert(fc.property(ipv4DecimalNotation, (value) => {
            expect(BinaryUtils.dottedDecimalNotationToBinaryString(value.decimalNotation)).toEqual(value.binary);
        }));
    });
    fit('Should pad given string with zeros to become given length', () => {
        fc.assert(fc.property(fc.tuple(fc.integer({min:0}).map((value: number) => {
            return value.toString(2)
        }), fc.integer({min:0, max:20})).filter(values => {
            return values[1] > values[0].length
        }), (value) => {
            expect(BinaryUtils.leftPadWithZeroBit(value[0], value[1]).length).toEqual(value[1]);
            expect(BinaryUtils.leftPadWithZeroBit(value[0], value[1]).endsWith(value[0])).toEqual(true);
        }));
        expect(BinaryUtils.leftPadWithZeroBit('10', 5)).toEqual('00010');
        expect(BinaryUtils.leftPadWithZeroBit('00010', 5)).toEqual('00010');
    });
    it('Should throw an exception if given string is already greater than required final length after padding', () => {
        expect(()=> {
            BinaryUtils.leftPadWithZeroBit('111111110', 5)
        }).toThrowError(Error, 'Given string is already longer than given final length after padding: 5');
    });
    fdescribe('IPv4 cidr prefix to binary string', () => {
      it('should convert prefix to mask binary string', () => {
          fc.assert(fc.property(fc.integer(1,32), (value) => {
              let maskString = BinaryUtils.cidrPrefixToMaskBinaryString(value, IPNumType.IPv4)
              expect(new RegExp(`^1{${value}}0{${32-value}}$`).test(maskString)).toBeTrue()
          }))
      });
      it('should throw an exception when converting 33 prefix', () => {
        expect(() => {
          BinaryUtils.cidrPrefixToMaskBinaryString(33, IPNumType.IPv4);
        }).toThrowError(Error, 'Value is greater than 32');
      });
    });
    describe('IPv6 cidr prefix to binary string', () => {
      it('should convert a 64 prefix', () => {
      expect(BinaryUtils.cidrPrefixToMaskBinaryString(64, IPNumType.IPv6)).toBe(`${"1".repeat(64)}${"0".repeat(64)}`)
      });
      it('should convert a 128 prefix', () => {
        expect(BinaryUtils.cidrPrefixToMaskBinaryString(128, IPNumType.IPv6)).toBe(`${"1".repeat(128)}`)
      });
      it('should throw an exception when converting 130 prefix', () => {
        expect(() => {
        BinaryUtils.cidrPrefixToMaskBinaryString(130, IPNumType.IPv6);
        }).toThrowError(Error, 'Value is greater than 128');
      });
    });

    describe('log2', () => {
        it('should calculate the log2 of a number', () => {
            expect(intLog2(bigInt(8))).toBe(3);
            expect(intLog2(bigInt(256))).toBe(8);
        });

        it('should throw an exception when no int log2', () => {
            expect(() => {
                intLog2(bigInt(12))
            }).toThrowError(Error)
        })
    })

    describe('matchingBitCount', () => {
        it('should return matching bit count same string', () => {
            expect(matchingBitCount("1010111", "1010111")).toEqual(7)
        });
        it('should return matching bit count different string same length', () => {
            expect(matchingBitCount("10101110100111010", "10101111101101110")).toEqual(7)
        });
        it('should return matching bit count different string, first string longer', () => {
            expect(matchingBitCount("10101110100111010001111", "10101111101101110")).toEqual(7)
        });
        it('should return matching bit count different string, second string longer', () => {
            expect(matchingBitCount("10101110100111010", "101011111011011100001111")).toEqual(7)
        });
    });
});