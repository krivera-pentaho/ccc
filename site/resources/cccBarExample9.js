new pvc.BarChart({
    canvas:      'cccBarExample9',
    width:       600,
    height:      400,
    title:       "Small Multiple Bar charts",
    orientation: 'horizontal',
    animate:     false,
    selectable:  true,
    hoverable:   true,
    stacked:     true,
    legend:      true,
    titleFont:      'bold 14px sans-serif',
    smallTitleFont: 'italic 12px sans-serif',
    ignoreNulls: false,
    dimensionGroups: {
        category: {comparer: def.ascending}
    }
})
.setData(testHeatGridComp, {
    isMultiValued: true,
    multiChartIndexes: [0, 1]
})
.render();