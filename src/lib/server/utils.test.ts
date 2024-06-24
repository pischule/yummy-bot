import { orderByExample } from '$lib/server/utils';
import { describe, expect, test } from 'vitest';

describe('orderByExample', () => {
  test('orders elements according to the example list', () => {
    const array = ['apple', 'banana', 'cherry', 'date', 'fig', 'grape'];
    const example = ['banana', 'date', 'fig'];
    const result = orderByExample(array, example);
    expect(result).toEqual([
      'banana',
      'date',
      'fig',
      'apple',
      'cherry',
      'grape',
    ]);
  });

  test('places elements not in the example list at the end in their original order', () => {
    const array = ['apple', 'banana', 'cherry'];
    const example = ['banana'];
    const result = orderByExample(array, example);
    expect(result).toEqual(['banana', 'apple', 'cherry']);
  });

  test('handles an empty example list by keeping the original order', () => {
    const array = ['apple', 'banana', 'cherry'];
    const example: string[] = [];
    const result = orderByExample(array, example);
    expect(result).toEqual(['apple', 'banana', 'cherry']);
  });

  test('handles an empty array', () => {
    const array: string[] = [];
    const example = ['banana', 'date', 'fig'];
    const result = orderByExample(array, example);
    expect(result).toEqual([]);
  });

  test('orders elements when example list contains new elements not in the array', () => {
    const array = ['apple', 'banana', 'cherry'];
    const example = ['banana', 'date', 'fig'];
    const result = orderByExample(array, example);
    expect(result).toEqual(['banana', 'apple', 'cherry']);
  });

  test('orders elements correctly when all elements are in the example list', () => {
    const array = ['apple', 'banana', 'cherry'];
    const example = ['cherry', 'banana', 'apple'];
    const result = orderByExample(array, example);
    expect(result).toEqual(['cherry', 'banana', 'apple']);
  });
});
