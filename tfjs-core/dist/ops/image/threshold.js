/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { tensor1d } from '../tensor1d';
import { op } from '../operation';
import { cast } from '../cast';
import { split } from '../split';
import { bincount } from '../bincount';
import { lessEqual } from '../less_equal';
import { greater } from '../greater';
import { sum } from '../sum';
import { add } from '../add';
import { mul } from '../mul';
import { div } from '../div';
import { sub } from '../sub';
import { round } from '../round';
import { where } from '../where';
import { fill } from '../fill';
import { slice } from '../slice';
import { range } from '../range';
import { tensor } from '../tensor';
import * as util from '../../util';
import { convertToTensor } from '../../tensor_util_env';
/**
 * Performs image binarization with corresponding threshold
 * (depends on the method)value, which creates a binary image from a grayscale.
 * @param image 3d tensor of shape [imageHeight,imageWidth, depth],
 * where imageHeight and imageWidth must be positive.The image color
 * range should be [0, 255].
 * @param method Optional string from `'binary' | 'otsu'`
 * which specifies the method for thresholding. Defaults to 'binary'.
 * @param inverted Optional boolean whichspecifies
 * if colours should be inverted. Defaults to false.
 * @param threshValue Optional number which defines threshold value from 0 to 1.
 * Defaults to 0.5.
 * @return A 3d tensor of shape [imageHeight,imageWidth, depth], which
 * contains binarized image.
 */
function threshold_(image, method = 'binary', inverted = false, threshValue = 0.5) {
    const $image = convertToTensor(image, 'image', 'threshold');
    /* 0.2989, 0.5870, 0.1140 are represent luma coefficients in CCIR601.
    Reference for converting between RGB and grayscale: https://en.wikipedia.org/wiki/Luma_%28video%29  */
    const RED_INTENCITY_COEF = 0.2989;
    const GREEN_INTENCITY_COEF = 0.5870;
    const BLUE_INTENCITY_COEF = 0.1140;
    const totalPixelsInImage = $image.shape[0] * $image.shape[1];
    let $threshold = mul(tensor1d([threshValue]), 255);
    let r, g, b, grayscale;
    util.assert($image.rank === 3, () => 'Error in threshold: image must be rank 3,' +
        `but got rank ${$image.rank}.`);
    util.assert($image.shape[2] === 3 || $image.shape[2] === 1, () => 'Error in threshold: ' +
        'image color channel must be equal to 3 or 1' +
        `but got ${$image.shape[2]}.`);
    util.assert($image.dtype === 'int32' || $image.dtype === 'float32', () => 'Error in dtype: image dtype must be int32 or float32,' +
        `but got dtype ${$image.dtype}.`);
    util.assert(method === 'otsu' || method === 'binary', () => `Method must be binary or otsu, but was ${method}`);
    if ($image.shape[2] === 3) {
        [r, g, b] = split($image, [1, 1, 1], -1);
        const $r = mul(r, RED_INTENCITY_COEF);
        const $g = mul(g, GREEN_INTENCITY_COEF);
        const $b = mul(b, BLUE_INTENCITY_COEF);
        grayscale = add(add($r, $g), $b);
    }
    else {
        grayscale = image;
    }
    if (method === 'otsu') {
        const $histogram = bincount(cast(round(grayscale), 'int32'), tensor([]), 256);
        $threshold = otsu($histogram, totalPixelsInImage);
    }
    const invCondition = inverted ?
        lessEqual(grayscale, $threshold) : greater(grayscale, $threshold);
    const result = cast(mul(invCondition, 255), 'int32');
    return result;
}
function otsu(histogram, total) {
    let bestThresh = tensor1d([-1]);
    let bestInBetVar = tensor1d([0]);
    let cInBetVar = tensor1d([0]);
    let classFirst, classSecond, meanFirst, meanSec, weightForeground, weightBack;
    for (let index = 0; index < histogram.size - 1; index++) {
        classFirst = slice(histogram, 0, index + 1);
        classSecond = slice(histogram, index + 1);
        weightForeground = div(sum(classFirst), total);
        weightBack = div(sum(classSecond), total);
        const meanFirstDivA = sum(mul(classFirst, range(0, classFirst.size)));
        meanFirst = div(meanFirstDivA, sum(classFirst));
        const meanSecFill = fill(classSecond.shape, classFirst.size);
        const meanSecAdd = add(range(0, classSecond.size), meanSecFill);
        const meanSecMul = mul(classSecond, (meanSecAdd));
        meanSec = div(sum(meanSecMul), sum(classSecond));
        const cInBetVarSubA = sub(meanFirst, meanSec);
        const cInBetVarSubB = sub(meanFirst, meanSec);
        const cInBetVarMul = mul(weightForeground, weightBack);
        cInBetVar = mul(mul(cInBetVarMul, cInBetVarSubA), cInBetVarSubB);
        const condition = greater(cInBetVar, bestInBetVar);
        bestInBetVar = where(condition, cInBetVar, bestInBetVar);
        bestThresh = where(condition, tensor1d([index]), bestThresh);
    }
    return bestThresh;
}
export const threshold = op({ threshold_ });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZXNob2xkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vdGZqcy1jb3JlL3NyYy9vcHMvaW1hZ2UvdGhyZXNob2xkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUdILE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFdkMsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUNsQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQy9CLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDakMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN2QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDckMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUM3QixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQzdCLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDN0IsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUM3QixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQzdCLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDakMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNqQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQy9CLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDL0IsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNqQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ25DLE9BQU8sS0FBSyxJQUFJLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUV4RDs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUVILFNBQVMsVUFBVSxDQUNmLEtBQTRCLEVBQzVCLE1BQU0sR0FBRyxRQUFRLEVBQ2pCLFFBQVEsR0FBRyxLQUFLLEVBQ2hCLFdBQVcsR0FBRyxHQUFHO0lBRWpCLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTVEOzBHQUNtRztJQUVuRyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQztJQUNsQyxNQUFNLG9CQUFvQixHQUFHLE1BQU0sQ0FBQztJQUNwQyxNQUFNLG1CQUFtQixHQUFHLE1BQU0sQ0FBQztJQUNuQyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3RCxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRCxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsQ0FBQztJQUV2QixJQUFJLENBQUMsTUFBTSxDQUNQLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUNqQixHQUFHLEVBQUUsQ0FBQywyQ0FBMkM7UUFDN0MsZ0JBQWdCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBRXhDLElBQUksQ0FBQyxNQUFNLENBQ1AsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLEVBQzdDLEdBQUcsRUFBRSxDQUFDLHNCQUFzQjtRQUN4Qiw2Q0FBNkM7UUFDN0MsV0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUV2QyxJQUFJLENBQUMsTUFBTSxDQUNULE1BQU0sQ0FBQyxLQUFLLEtBQUssT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUN0RCxHQUFHLEVBQUUsQ0FBQyx1REFBdUQ7UUFDekQsaUJBQWlCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBRXhDLElBQUksQ0FBQyxNQUFNLENBQ1QsTUFBTSxLQUFLLE1BQU0sSUFBSSxNQUFNLEtBQUssUUFBUSxFQUN4QyxHQUFHLEVBQUUsQ0FBQywwQ0FBMEMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUU1RCxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3ZCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNyQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDdkMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RDLFNBQVMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNwQztTQUFNO1FBQ0gsU0FBUyxHQUFHLEtBQUssQ0FBQztLQUNyQjtJQUVELElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtRQUNuQixNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLENBQWEsRUFDbkUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUNWLEdBQUcsQ0FBQyxDQUFDO1FBQ1QsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztLQUNyRDtJQUVELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxDQUFDO1FBQzNCLFNBQVMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFdEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFcEQsT0FBTyxNQUFrQixDQUFDO0FBQzlCLENBQUM7QUFFRCxTQUFTLElBQUksQ0FBQyxTQUFtQixFQUFFLEtBQWE7SUFFNUMsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakMsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QixJQUFJLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUNsQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDO0lBRTFDLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxHQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUVuRCxVQUFVLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRTVDLFdBQVcsR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztRQUV6QyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTlDLFVBQVUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXpDLE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV0RSxTQUFTLEdBQUcsR0FBRyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUUsQ0FBQztRQUVqRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzlELE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRWpELE1BQU0sYUFBYSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUMsTUFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5QyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkQsU0FBUyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFDLGFBQWEsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWhFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFFbkQsWUFBWSxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXpELFVBQVUsR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FFaEU7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUN0QixDQUFDO0FBRUQsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAyMSBHb29nbGUgTExDLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHBzOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqL1xuXG5pbXBvcnQgeyBUZW5zb3IxRCwgVGVuc29yM0QgfSBmcm9tICcuLi8uLi90ZW5zb3InO1xuaW1wb3J0IHsgdGVuc29yMWQgfSBmcm9tICcuLi90ZW5zb3IxZCc7XG5pbXBvcnQgeyBUZW5zb3JMaWtlIH0gZnJvbSAnLi4vLi4vdHlwZXMnO1xuaW1wb3J0IHsgb3AgfSBmcm9tICcuLi9vcGVyYXRpb24nO1xuaW1wb3J0IHsgY2FzdCB9IGZyb20gJy4uL2Nhc3QnO1xuaW1wb3J0IHsgc3BsaXQgfSBmcm9tICcuLi9zcGxpdCc7XG5pbXBvcnQgeyBiaW5jb3VudCB9IGZyb20gJy4uL2JpbmNvdW50JztcbmltcG9ydCB7IGxlc3NFcXVhbCB9IGZyb20gJy4uL2xlc3NfZXF1YWwnO1xuaW1wb3J0IHsgZ3JlYXRlciB9IGZyb20gJy4uL2dyZWF0ZXInO1xuaW1wb3J0IHsgc3VtIH0gZnJvbSAnLi4vc3VtJztcbmltcG9ydCB7IGFkZCB9IGZyb20gJy4uL2FkZCc7XG5pbXBvcnQgeyBtdWwgfSBmcm9tICcuLi9tdWwnO1xuaW1wb3J0IHsgZGl2IH0gZnJvbSAnLi4vZGl2JztcbmltcG9ydCB7IHN1YiB9IGZyb20gJy4uL3N1Yic7XG5pbXBvcnQgeyByb3VuZCB9IGZyb20gJy4uL3JvdW5kJztcbmltcG9ydCB7IHdoZXJlIH0gZnJvbSAnLi4vd2hlcmUnO1xuaW1wb3J0IHsgZmlsbCB9IGZyb20gJy4uL2ZpbGwnO1xuaW1wb3J0IHtzbGljZX0gZnJvbSAnLi4vc2xpY2UnO1xuaW1wb3J0IHsgcmFuZ2UgfSBmcm9tICcuLi9yYW5nZSc7XG5pbXBvcnQgeyB0ZW5zb3IgfSBmcm9tICcuLi90ZW5zb3InO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuLi8uLi91dGlsJztcbmltcG9ydCB7IGNvbnZlcnRUb1RlbnNvciB9IGZyb20gJy4uLy4uL3RlbnNvcl91dGlsX2Vudic7XG5cbi8qKlxuICogUGVyZm9ybXMgaW1hZ2UgYmluYXJpemF0aW9uIHdpdGggY29ycmVzcG9uZGluZyB0aHJlc2hvbGRcbiAqIChkZXBlbmRzIG9uIHRoZSBtZXRob2QpdmFsdWUsIHdoaWNoIGNyZWF0ZXMgYSBiaW5hcnkgaW1hZ2UgZnJvbSBhIGdyYXlzY2FsZS5cbiAqIEBwYXJhbSBpbWFnZSAzZCB0ZW5zb3Igb2Ygc2hhcGUgW2ltYWdlSGVpZ2h0LGltYWdlV2lkdGgsIGRlcHRoXSxcbiAqIHdoZXJlIGltYWdlSGVpZ2h0IGFuZCBpbWFnZVdpZHRoIG11c3QgYmUgcG9zaXRpdmUuVGhlIGltYWdlIGNvbG9yXG4gKiByYW5nZSBzaG91bGQgYmUgWzAsIDI1NV0uXG4gKiBAcGFyYW0gbWV0aG9kIE9wdGlvbmFsIHN0cmluZyBmcm9tIGAnYmluYXJ5JyB8ICdvdHN1J2BcbiAqIHdoaWNoIHNwZWNpZmllcyB0aGUgbWV0aG9kIGZvciB0aHJlc2hvbGRpbmcuIERlZmF1bHRzIHRvICdiaW5hcnknLlxuICogQHBhcmFtIGludmVydGVkIE9wdGlvbmFsIGJvb2xlYW4gd2hpY2hzcGVjaWZpZXNcbiAqIGlmIGNvbG91cnMgc2hvdWxkIGJlIGludmVydGVkLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEBwYXJhbSB0aHJlc2hWYWx1ZSBPcHRpb25hbCBudW1iZXIgd2hpY2ggZGVmaW5lcyB0aHJlc2hvbGQgdmFsdWUgZnJvbSAwIHRvIDEuXG4gKiBEZWZhdWx0cyB0byAwLjUuXG4gKiBAcmV0dXJuIEEgM2QgdGVuc29yIG9mIHNoYXBlIFtpbWFnZUhlaWdodCxpbWFnZVdpZHRoLCBkZXB0aF0sIHdoaWNoXG4gKiBjb250YWlucyBiaW5hcml6ZWQgaW1hZ2UuXG4gKi9cblxuZnVuY3Rpb24gdGhyZXNob2xkXyhcbiAgICBpbWFnZTogVGVuc29yM0QgfCBUZW5zb3JMaWtlLFxuICAgIG1ldGhvZCA9ICdiaW5hcnknLFxuICAgIGludmVydGVkID0gZmFsc2UsXG4gICAgdGhyZXNoVmFsdWUgPSAwLjVcbik6IFRlbnNvcjNEIHtcbiAgICBjb25zdCAkaW1hZ2UgPSBjb252ZXJ0VG9UZW5zb3IoaW1hZ2UsICdpbWFnZScsICd0aHJlc2hvbGQnKTtcblxuICAgIC8qIDAuMjk4OSwgMC41ODcwLCAwLjExNDAgYXJlIHJlcHJlc2VudCBsdW1hIGNvZWZmaWNpZW50cyBpbiBDQ0lSNjAxLlxuXHRSZWZlcmVuY2UgZm9yIGNvbnZlcnRpbmcgYmV0d2VlbiBSR0IgYW5kIGdyYXlzY2FsZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTHVtYV8lMjh2aWRlbyUyOSAgKi9cblxuICAgIGNvbnN0IFJFRF9JTlRFTkNJVFlfQ09FRiA9IDAuMjk4OTtcbiAgICBjb25zdCBHUkVFTl9JTlRFTkNJVFlfQ09FRiA9IDAuNTg3MDtcbiAgICBjb25zdCBCTFVFX0lOVEVOQ0lUWV9DT0VGID0gMC4xMTQwO1xuICAgIGNvbnN0IHRvdGFsUGl4ZWxzSW5JbWFnZSA9ICRpbWFnZS5zaGFwZVswXSAqICRpbWFnZS5zaGFwZVsxXTtcblxuICAgIGxldCAkdGhyZXNob2xkID0gbXVsKHRlbnNvcjFkKFt0aHJlc2hWYWx1ZV0pLCAyNTUpO1xuICAgIGxldCByLCBnLCBiLCBncmF5c2NhbGU7XG5cbiAgICB1dGlsLmFzc2VydChcbiAgICAgICAgJGltYWdlLnJhbmsgPT09IDMsXG4gICAgICAgICgpID0+ICdFcnJvciBpbiB0aHJlc2hvbGQ6IGltYWdlIG11c3QgYmUgcmFuayAzLCcgK1xuICAgICAgICAgICAgYGJ1dCBnb3QgcmFuayAkeyRpbWFnZS5yYW5rfS5gKTtcblxuICAgIHV0aWwuYXNzZXJ0KFxuICAgICAgICAkaW1hZ2Uuc2hhcGVbMl0gPT09IDMgfHwgJGltYWdlLnNoYXBlWzJdPT09IDEsXG4gICAgICAgICgpID0+ICdFcnJvciBpbiB0aHJlc2hvbGQ6ICcgK1xuICAgICAgICAgICAgJ2ltYWdlIGNvbG9yIGNoYW5uZWwgbXVzdCBiZSBlcXVhbCB0byAzIG9yIDEnICtcbiAgICAgICAgICAgIGBidXQgZ290ICR7JGltYWdlLnNoYXBlWzJdfS5gKTtcblxuICAgIHV0aWwuYXNzZXJ0KFxuICAgICAgJGltYWdlLmR0eXBlID09PSAnaW50MzInIHx8ICRpbWFnZS5kdHlwZSA9PT0gJ2Zsb2F0MzInLFxuICAgICAgKCkgPT4gJ0Vycm9yIGluIGR0eXBlOiBpbWFnZSBkdHlwZSBtdXN0IGJlIGludDMyIG9yIGZsb2F0MzIsJyArXG4gICAgICAgICAgYGJ1dCBnb3QgZHR5cGUgJHskaW1hZ2UuZHR5cGV9LmApO1xuXG4gICAgdXRpbC5hc3NlcnQoXG4gICAgICBtZXRob2QgPT09ICdvdHN1JyB8fCBtZXRob2QgPT09ICdiaW5hcnknLFxuICAgICAgKCkgPT4gYE1ldGhvZCBtdXN0IGJlIGJpbmFyeSBvciBvdHN1LCBidXQgd2FzICR7bWV0aG9kfWApO1xuXG4gICAgaWYgKCRpbWFnZS5zaGFwZVsyXSA9PT0gMykge1xuICAgICAgICBbciwgZywgYl0gPSBzcGxpdCgkaW1hZ2UsIFsxLCAxLCAxXSwgLTEpO1xuICAgICAgICBjb25zdCAkciA9IG11bChyLFJFRF9JTlRFTkNJVFlfQ09FRik7XG4gICAgICAgIGNvbnN0ICRnID0gbXVsKGcsR1JFRU5fSU5URU5DSVRZX0NPRUYpO1xuICAgICAgICBjb25zdCAkYiA9IG11bChiLEJMVUVfSU5URU5DSVRZX0NPRUYpO1xuICAgICAgICBncmF5c2NhbGUgPSBhZGQoYWRkKCRyLCAkZyksICRiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBncmF5c2NhbGUgPSBpbWFnZTtcbiAgICB9XG5cbiAgICBpZiAobWV0aG9kID09PSAnb3RzdScpIHtcbiAgICAgICAgY29uc3QgJGhpc3RvZ3JhbSA9IGJpbmNvdW50KGNhc3Qocm91bmQoZ3JheXNjYWxlKSwgJ2ludDMyJykgYXMgVGVuc29yMUQsXG4gICAgICAgICAgICB0ZW5zb3IoW10pLFxuICAgICAgICAgICAgMjU2KTtcbiAgICAgICAgJHRocmVzaG9sZCA9IG90c3UoJGhpc3RvZ3JhbSwgdG90YWxQaXhlbHNJbkltYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnZDb25kaXRpb24gPSBpbnZlcnRlZCA/XG4gICAgICAgIGxlc3NFcXVhbChncmF5c2NhbGUsICR0aHJlc2hvbGQpIDogZ3JlYXRlcihncmF5c2NhbGUsICR0aHJlc2hvbGQpO1xuXG4gICAgY29uc3QgcmVzdWx0ID0gY2FzdChtdWwoaW52Q29uZGl0aW9uLDI1NSksICdpbnQzMicpO1xuXG4gICAgcmV0dXJuIHJlc3VsdCBhcyBUZW5zb3IzRDtcbn1cblxuZnVuY3Rpb24gb3RzdShoaXN0b2dyYW06IFRlbnNvcjFELCB0b3RhbDogbnVtYmVyKTpUZW5zb3IxRCB7XG5cbiAgICBsZXQgYmVzdFRocmVzaCA9IHRlbnNvcjFkKFstMV0pO1xuICAgIGxldCBiZXN0SW5CZXRWYXIgPSB0ZW5zb3IxZChbMF0pO1xuICAgIGxldCBjSW5CZXRWYXIgPSB0ZW5zb3IxZChbMF0pO1xuICAgIGxldCBjbGFzc0ZpcnN0LCBjbGFzc1NlY29uZCwgbWVhbkZpcnN0LFxuICAgICAgICBtZWFuU2VjLCB3ZWlnaHRGb3JlZ3JvdW5kLCB3ZWlnaHRCYWNrO1xuXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGhpc3RvZ3JhbS5zaXplLTE7IGluZGV4KyspIHtcblxuICAgICAgICBjbGFzc0ZpcnN0ID0gc2xpY2UoaGlzdG9ncmFtLCAwLCBpbmRleCArIDEpO1xuXG4gICAgICAgIGNsYXNzU2Vjb25kID0gc2xpY2UoaGlzdG9ncmFtLGluZGV4ICsgMSk7XG5cbiAgICAgICAgd2VpZ2h0Rm9yZWdyb3VuZCA9IGRpdihzdW0oY2xhc3NGaXJzdCksdG90YWwpO1xuXG4gICAgICAgIHdlaWdodEJhY2sgPSBkaXYoc3VtKGNsYXNzU2Vjb25kKSx0b3RhbCk7XG5cbiAgICAgICAgY29uc3QgbWVhbkZpcnN0RGl2QSA9IHN1bShtdWwoY2xhc3NGaXJzdCwgcmFuZ2UoMCwgY2xhc3NGaXJzdC5zaXplKSkpO1xuXG4gICAgICAgIG1lYW5GaXJzdCA9IGRpdihtZWFuRmlyc3REaXZBLCBzdW0oY2xhc3NGaXJzdCkgKTtcblxuICAgICAgICBjb25zdCBtZWFuU2VjRmlsbCA9IGZpbGwoY2xhc3NTZWNvbmQuc2hhcGUsIGNsYXNzRmlyc3Quc2l6ZSk7XG4gICAgICAgIGNvbnN0IG1lYW5TZWNBZGQgPSBhZGQocmFuZ2UoMCxjbGFzc1NlY29uZC5zaXplKSxtZWFuU2VjRmlsbCk7XG4gICAgICAgIGNvbnN0IG1lYW5TZWNNdWwgPSBtdWwoY2xhc3NTZWNvbmQsIChtZWFuU2VjQWRkKSk7XG4gICAgICAgIG1lYW5TZWMgPSBkaXYoc3VtKG1lYW5TZWNNdWwpLCBzdW0oY2xhc3NTZWNvbmQpKTtcblxuICAgICAgICBjb25zdCBjSW5CZXRWYXJTdWJBID0gc3ViKG1lYW5GaXJzdCwgbWVhblNlYyk7XG4gICAgICAgIGNvbnN0IGNJbkJldFZhclN1YkIgPSBzdWIobWVhbkZpcnN0LCBtZWFuU2VjKTtcbiAgICAgICAgY29uc3QgY0luQmV0VmFyTXVsID0gbXVsKHdlaWdodEZvcmVncm91bmQsIHdlaWdodEJhY2spO1xuICAgICAgICBjSW5CZXRWYXIgPSBtdWwobXVsKGNJbkJldFZhck11bCxjSW5CZXRWYXJTdWJBKSwgY0luQmV0VmFyU3ViQik7XG5cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gZ3JlYXRlcihjSW5CZXRWYXIsIGJlc3RJbkJldFZhcik7XG5cbiAgICAgICAgYmVzdEluQmV0VmFyID0gd2hlcmUoY29uZGl0aW9uLCBjSW5CZXRWYXIsIGJlc3RJbkJldFZhcik7XG5cbiAgICAgICAgYmVzdFRocmVzaCA9IHdoZXJlKGNvbmRpdGlvbiwgdGVuc29yMWQoW2luZGV4XSksIGJlc3RUaHJlc2gpO1xuXG4gICAgfVxuICAgIHJldHVybiBiZXN0VGhyZXNoO1xufVxuXG5leHBvcnQgY29uc3QgdGhyZXNob2xkID0gb3AoeyB0aHJlc2hvbGRfIH0pO1xuIl19