/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as tf from '../index';
import { ALL_ENVS, describeWithFlags } from '../jasmine_util';
import { expectArraysClose } from '../test_util';
describeWithFlags('AdagradOptimizer', ALL_ENVS, () => {
    it('basic', async () => {
        const initialTensors = tf.memory().numTensors;
        const learningRate = .1;
        const initialAccumulatorValue = .1;
        const optimizer = tf.train.adagrad(learningRate, initialAccumulatorValue);
        const x = tf.tensor1d([1, 2]).variable();
        const f = () => x.square().sum();
        let numTensors = tf.memory().numTensors;
        let cost = optimizer.minimize(f, /* returnCost */ true);
        // Cost & accumulator should be the only additional arrays.
        expect(tf.memory().numTensors).toBe(numTensors + 2);
        // epsilon = 1-e8
        // newAccumulatedGrad = accumulatedGrad + grad^2
        // x -= (learningRate * grad) / sqrt(newAccumulatedGrad + eps)
        // de/dx = [2, 4]
        // accumulatedGrad = [0.1, 0.1]
        // newAccumulatedGrad = [4.1, 16.1]
        // x = [0.9012270405, 1.900311042]
        expectArraysClose(await x.data(), [0.9012270405, 1.9003110428]);
        cost.dispose();
        numTensors = tf.memory().numTensors;
        cost = optimizer.minimize(f, /* returnCost */ false);
        // de/dx = [1.802454081, 3.9501555214]
        // accumulatedGrad = [4.1, 16.1]
        // newAccumulatedGrad = [7.3488407141, 31.7037286432]
        // x = [0.8347372764, 1.83015597828]
        // TODO: Fix numerical precision.
        expectArraysClose(await x.data(), [0.8347372764, 1.83015597828], 1e-2);
        // There should be no new additional Tensors.
        expect(tf.memory().numTensors).toBe(numTensors);
        expect(cost).toBe(null);
        x.dispose();
        optimizer.dispose();
        // The only additional tensor remaining is the argument to variable().
        expect(tf.memory().numTensors).toBe(initialTensors + 1);
    });
    it('Continue training after loading weights', async () => {
        const learningRate = .1;
        const initialAccumulatorValue = .1;
        const optimizer1 = tf.train.adagrad(learningRate, initialAccumulatorValue);
        const x = tf.tensor1d([2, 4]).variable();
        const f = () => x.square().sum();
        let cost = optimizer1.minimize(f, /* returnCost */ true);
        expectArraysClose(await cost.data(), 20);
        const weights = await optimizer1.getWeights();
        expect(weights.length).toEqual(2);
        expect(weights[0].name).toEqual('iter');
        expect(weights[1].name).toEqual(`${x.name}/accumulator`);
        const optimizer2 = tf.train.adam(learningRate, initialAccumulatorValue);
        await optimizer2.setWeights(weights);
        cost = optimizer2.minimize(f, /* returnCost */ true);
        expectArraysClose(await cost.data(), 18.82179);
        expect(optimizer2.iterations).toEqual(2);
    });
    it('serialization round-trip', () => {
        const originalOpt = tf.train.adagrad(0.1, 0.2);
        const reserialized = tf.AdagradOptimizer.fromConfig(tf.AdagradOptimizer, originalOpt.getConfig());
        expect(reserialized.getConfig()).toEqual(originalOpt.getConfig());
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRhZ3JhZF9vcHRpbWl6ZXJfdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RmanMtY29yZS9zcmMvb3B0aW1pemVycy9hZGFncmFkX29wdGltaXplcl90ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUVILE9BQU8sS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQy9CLE9BQU8sRUFBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFL0MsaUJBQWlCLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRTtJQUNuRCxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFO1FBQ3JCLE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUM7UUFDOUMsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLE1BQU0sdUJBQXVCLEdBQUcsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBRTFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUV6QyxNQUFNLENBQUMsR0FBb0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWxELElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxVQUFVLENBQUM7UUFFeEMsSUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsZ0JBQWdCLENB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QXVCLENBQUMsQ0FBQztRQUN4RSxNQUFNLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFckMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JELGlCQUFpQixDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUNsQyxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDL0MsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FDL0MsRUFBRSxDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDcEUsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE4IEdvb2dsZSBMTEMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuaW1wb3J0ICogYXMgdGYgZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHtBTExfRU5WUywgZGVzY3JpYmVXaXRoRmxhZ3N9IGZyb20gJy4uL2phc21pbmVfdXRpbCc7XG5pbXBvcnQge2V4cGVjdEFycmF5c0Nsb3NlfSBmcm9tICcuLi90ZXN0X3V0aWwnO1xuXG5kZXNjcmliZVdpdGhGbGFncygnQWRhZ3JhZE9wdGltaXplcicsIEFMTF9FTlZTLCAoKSA9PiB7XG4gIGl0KCdiYXNpYycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBpbml0aWFsVGVuc29ycyA9IHRmLm1lbW9yeSgpLm51bVRlbnNvcnM7XG4gICAgY29uc3QgbGVhcm5pbmdSYXRlID0gLjE7XG4gICAgY29uc3QgaW5pdGlhbEFjY3VtdWxhdG9yVmFsdWUgPSAuMTtcbiAgICBjb25zdCBvcHRpbWl6ZXIgPSB0Zi50cmFpbi5hZGFncmFkKGxlYXJuaW5nUmF0ZSwgaW5pdGlhbEFjY3VtdWxhdG9yVmFsdWUpO1xuXG4gICAgY29uc3QgeCA9IHRmLnRlbnNvcjFkKFsxLCAyXSkudmFyaWFibGUoKTtcblxuICAgIGNvbnN0IGY6ICgpID0+IHRmLlNjYWxhciA9ICgpID0+IHguc3F1YXJlKCkuc3VtKCk7XG5cbiAgICBsZXQgbnVtVGVuc29ycyA9IHRmLm1lbW9yeSgpLm51bVRlbnNvcnM7XG5cbiAgICBsZXQgY29zdCA9IG9wdGltaXplci5taW5pbWl6ZShmLCAvKiByZXR1cm5Db3N0ICovIHRydWUpO1xuXG4gICAgLy8gQ29zdCAmIGFjY3VtdWxhdG9yIHNob3VsZCBiZSB0aGUgb25seSBhZGRpdGlvbmFsIGFycmF5cy5cbiAgICBleHBlY3QodGYubWVtb3J5KCkubnVtVGVuc29ycykudG9CZShudW1UZW5zb3JzICsgMik7XG5cbiAgICAvLyBlcHNpbG9uID0gMS1lOFxuICAgIC8vIG5ld0FjY3VtdWxhdGVkR3JhZCA9IGFjY3VtdWxhdGVkR3JhZCArIGdyYWReMlxuICAgIC8vIHggLT0gKGxlYXJuaW5nUmF0ZSAqIGdyYWQpIC8gc3FydChuZXdBY2N1bXVsYXRlZEdyYWQgKyBlcHMpXG4gICAgLy8gZGUvZHggPSBbMiwgNF1cbiAgICAvLyBhY2N1bXVsYXRlZEdyYWQgPSBbMC4xLCAwLjFdXG4gICAgLy8gbmV3QWNjdW11bGF0ZWRHcmFkID0gWzQuMSwgMTYuMV1cbiAgICAvLyB4ID0gWzAuOTAxMjI3MDQwNSwgMS45MDAzMTEwNDJdXG4gICAgZXhwZWN0QXJyYXlzQ2xvc2UoYXdhaXQgeC5kYXRhKCksIFswLjkwMTIyNzA0MDUsIDEuOTAwMzExMDQyOF0pO1xuXG4gICAgY29zdC5kaXNwb3NlKCk7XG4gICAgbnVtVGVuc29ycyA9IHRmLm1lbW9yeSgpLm51bVRlbnNvcnM7XG5cbiAgICBjb3N0ID0gb3B0aW1pemVyLm1pbmltaXplKGYsIC8qIHJldHVybkNvc3QgKi8gZmFsc2UpO1xuXG4gICAgLy8gZGUvZHggPSBbMS44MDI0NTQwODEsIDMuOTUwMTU1NTIxNF1cbiAgICAvLyBhY2N1bXVsYXRlZEdyYWQgPSBbNC4xLCAxNi4xXVxuICAgIC8vIG5ld0FjY3VtdWxhdGVkR3JhZCA9IFs3LjM0ODg0MDcxNDEsIDMxLjcwMzcyODY0MzJdXG4gICAgLy8geCA9IFswLjgzNDczNzI3NjQsIDEuODMwMTU1OTc4MjhdXG5cbiAgICAvLyBUT0RPOiBGaXggbnVtZXJpY2FsIHByZWNpc2lvbi5cbiAgICBleHBlY3RBcnJheXNDbG9zZShhd2FpdCB4LmRhdGEoKSwgWzAuODM0NzM3Mjc2NCwgMS44MzAxNTU5NzgyOF0sIDFlLTIpO1xuXG4gICAgLy8gVGhlcmUgc2hvdWxkIGJlIG5vIG5ldyBhZGRpdGlvbmFsIFRlbnNvcnMuXG4gICAgZXhwZWN0KHRmLm1lbW9yeSgpLm51bVRlbnNvcnMpLnRvQmUobnVtVGVuc29ycyk7XG5cbiAgICBleHBlY3QoY29zdCkudG9CZShudWxsKTtcblxuICAgIHguZGlzcG9zZSgpO1xuICAgIG9wdGltaXplci5kaXNwb3NlKCk7XG5cbiAgICAvLyBUaGUgb25seSBhZGRpdGlvbmFsIHRlbnNvciByZW1haW5pbmcgaXMgdGhlIGFyZ3VtZW50IHRvIHZhcmlhYmxlKCkuXG4gICAgZXhwZWN0KHRmLm1lbW9yeSgpLm51bVRlbnNvcnMpLnRvQmUoaW5pdGlhbFRlbnNvcnMgKyAxKTtcbiAgfSk7XG5cbiAgaXQoJ0NvbnRpbnVlIHRyYWluaW5nIGFmdGVyIGxvYWRpbmcgd2VpZ2h0cycsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBsZWFybmluZ1JhdGUgPSAuMTtcbiAgICBjb25zdCBpbml0aWFsQWNjdW11bGF0b3JWYWx1ZSA9IC4xO1xuICAgIGNvbnN0IG9wdGltaXplcjEgPSB0Zi50cmFpbi5hZGFncmFkKGxlYXJuaW5nUmF0ZSwgaW5pdGlhbEFjY3VtdWxhdG9yVmFsdWUpO1xuXG4gICAgY29uc3QgeCA9IHRmLnRlbnNvcjFkKFsyLCA0XSkudmFyaWFibGUoKTtcbiAgICBjb25zdCBmOiAoKSA9PiB0Zi5TY2FsYXIgPSAoKSA9PiB4LnNxdWFyZSgpLnN1bSgpO1xuICAgIGxldCBjb3N0ID0gb3B0aW1pemVyMS5taW5pbWl6ZShmLCAvKiByZXR1cm5Db3N0ICovIHRydWUpO1xuICAgIGV4cGVjdEFycmF5c0Nsb3NlKGF3YWl0IGNvc3QuZGF0YSgpLCAyMCk7XG5cbiAgICBjb25zdCB3ZWlnaHRzID0gYXdhaXQgb3B0aW1pemVyMS5nZXRXZWlnaHRzKCk7XG4gICAgZXhwZWN0KHdlaWdodHMubGVuZ3RoKS50b0VxdWFsKDIpO1xuICAgIGV4cGVjdCh3ZWlnaHRzWzBdLm5hbWUpLnRvRXF1YWwoJ2l0ZXInKTtcbiAgICBleHBlY3Qod2VpZ2h0c1sxXS5uYW1lKS50b0VxdWFsKGAke3gubmFtZX0vYWNjdW11bGF0b3JgKTtcblxuICAgIGNvbnN0IG9wdGltaXplcjIgPSB0Zi50cmFpbi5hZGFtKGxlYXJuaW5nUmF0ZSwgaW5pdGlhbEFjY3VtdWxhdG9yVmFsdWUpO1xuICAgIGF3YWl0IG9wdGltaXplcjIuc2V0V2VpZ2h0cyh3ZWlnaHRzKTtcblxuICAgIGNvc3QgPSBvcHRpbWl6ZXIyLm1pbmltaXplKGYsIC8qIHJldHVybkNvc3QgKi8gdHJ1ZSk7XG4gICAgZXhwZWN0QXJyYXlzQ2xvc2UoYXdhaXQgY29zdC5kYXRhKCksIDE4LjgyMTc5KTtcbiAgICBleHBlY3Qob3B0aW1pemVyMi5pdGVyYXRpb25zKS50b0VxdWFsKDIpO1xuICB9KTtcblxuICBpdCgnc2VyaWFsaXphdGlvbiByb3VuZC10cmlwJywgKCkgPT4ge1xuICAgIGNvbnN0IG9yaWdpbmFsT3B0ID0gdGYudHJhaW4uYWRhZ3JhZCgwLjEsIDAuMik7XG4gICAgY29uc3QgcmVzZXJpYWxpemVkID0gdGYuQWRhZ3JhZE9wdGltaXplci5mcm9tQ29uZmlnKFxuICAgICAgICB0Zi5BZGFncmFkT3B0aW1pemVyLCBvcmlnaW5hbE9wdC5nZXRDb25maWcoKSk7XG4gICAgZXhwZWN0KHJlc2VyaWFsaXplZC5nZXRDb25maWcoKSkudG9FcXVhbChvcmlnaW5hbE9wdC5nZXRDb25maWcoKSk7XG4gIH0pO1xufSk7XG4iXX0=