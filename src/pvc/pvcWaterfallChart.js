/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * WaterfallChart is the class that generates waterfall charts.
 *
 * The waterfall chart is an alternative to the pie chart for
 * showing distributions. The advantage of the waterfall chart is that
 * it possibilities to visualize sub-totals and offers more convenient
 * possibilities to compare the size of categories (in a pie-chart you
 * have to compare wedges that are at a different angle, which
 * requires some additional processing/brainpower of the end-user).
 *
 * Waterfall charts are basically Bar-charts with some added
 * functionality. Given the complexity of the added features this
 * class has it's own code-base. However, it would be easy to
 * derive a BarChart class from this class by switching off a few
 * features.
 *
 * If you have an issue or suggestions regarding the Waterfall-charts
 * please contact CvK at cde@vinzi.nl
 */
def
.type('pvc.WaterfallChart', pvc.BarAbstract)
.init(function(options){

    this.base(options);
    
    var parent = this.parent;
    if(parent) {
        this._isFalling = parent._isFalling;
    }
})
.add({
    _animatable: true,
    
    _isFalling: true,
    _ruleInfos: null,
    _waterColor: pv.color("#1f77b4").darker(),

    /**
     * Processes options after user options and default options have been merged.
     * @override
     */
    _processOptionsCore: function(options){

        // Might still affect scale calculation
        options.stacked = true;
        
        // Doesn't work (yet?);
        options.baseAxisComposite = false;
        
        this.base(options);
        
        // Not supported
        options.plot2 = false;
    },
  
    _initPlotsCore: function(){
        var options = this.options;
        
        var waterPlot = new pvc.visual.WaterfallPlot(this);
        
        this._isFalling = waterPlot.option('Direction') === 'down';
        
        var travProp = this._isFalling ? 'FlattenDfsPre' : 'FlattenDfsPost';
        this._catRole.setTraversalMode(pvc.visual.TraversalMode[travProp]);
        
        this._catRole.setRootLabel(waterPlot.option('AllCategoryLabel'));
    },
    
    _initLegendScenes: function(legendPanel){
        
        var waterPlot = this.plots.water;
        
        var extAbsId = pvc.makeExtensionAbsId('line', waterPlot.extensionPrefixes);
        var strokeStyle = this._getConstantExtension(extAbsId, 'strokeStyle');
        if(strokeStyle){
            this._waterColor = pv.color(strokeStyle);
        }
        
        var rootScene = legendPanel._getBulletRootScene();
        
        new pvc.visual.legend.WaterfallBulletGroupScene(rootScene, {
            extensionPrefix: pvc.buildIndexedId('', 1),
            label: waterPlot.option('TotalLineLabel'),
            color: this._waterColor
        });
        
        this.base(legendPanel);
    },
    
    /**
     * Reduce operation of category ranges, into a global range.
     *
     * Propagates the total value.
     *
     * Also creates the array of rule information {@link #_ruleInfos}
     * used by the waterfall panel to draw the rules.
     *
     * Supports {@link #_getContinuousVisibleExtent}.
     */
    _reduceStackedCategoryValueExtent: function(result, catRange, catGroup){
        /*
         * That min + max are the variation of this category
         * relies on the concrete base._getStackedCategoryValueExtent() implementation...
         * Max always contains the sum of positives, if any, or 0
         * Min always contains the sum of negatives, if any, or 0
         * max >= 0
         * min <= 0
         */
        /*
         * When falling, the first category is surely *the* global total.
         * When falling, the first category must set the initial offset
         * and, unlike every other category group such that _isFlattenGroup===true,
         * it does contribute to the offset, and positively.
         * The offset property accumulates the values.
         */
        
        // previous offset
        var offsetPrev  = result ? result.offset : 0;
        var offsetDelta = catRange.min + catRange.max;
        var offsetNext;
        if(!result) {
            if(catRange) {
                offsetNext = offsetPrev + offsetDelta;
                this._ruleInfos = [{
                    offset: offsetNext,
                    group:  catGroup,
                    range:  catRange
                }];

                // Copy the range object
                return {
                    min:    catRange.min,
                    max:    catRange.max,
                    offset: offsetNext
                };
            }

            return null;
        }
        
        var isFalling = this._isFalling;
        var isProperGroup = catGroup._isFlattenGroup && !catGroup._isDegenerateFlattenGroup;
        if(!isProperGroup) {
            // offset, min, max may be affected
            var dir = isFalling ? -1 : 1;
            offsetNext = result.offset = offsetPrev + dir * offsetDelta;
            
            if(offsetNext > result.max) { result.max = offsetNext; }
            else 
            if(offsetNext < result.min) { result.min = offsetNext; }
            
        } else {
            // offset not affected
            // min, max may be affected
            var deltaUp = -catRange.min; // positive
            if(deltaUp > 0) {
                var top = offsetPrev + deltaUp;
                if(top > result.max) { result.max = top; }
            }
            
            var deltaDown = -catRange.max; // negative
            if(deltaDown < 0) {
                var bottom = offsetPrev + deltaDown;
                if(bottom < result.min) { result.min = bottom; }
            }
        }

        this._ruleInfos.push({
            offset: isFalling ? offsetPrev : result.offset,
            group:  catGroup,
            range:  catRange
        });
        
        return result;
    },
    
    /* @override */
    _createPlotPanels: function(parentPanel, baseOptions){
        this.wfChartPanel = 
            new pvc.WaterfallPanel(
                    this, 
                    parentPanel, 
                    this.plots.water, 
                    def.create(baseOptions, {
                        waterfall:  this.options.waterfall
                    }));
    }
});
