import colors from "./sacredtexts/colors.json" assert { type: "json" }
import forms from "./sacredtexts/forms.json" assert { type: "json" }
import gameSheet from "./sacredtexts/gameSheet.json" assert { type: "json" }
import robotAnimations from "./sacredtexts/robotAnimations.json" assert { type: "json" }

import colorOrder from "./extradata/colorOrder.json" assert { type: "json" }
import hardcodedUnlocks from "./extradata/hardcodedUnlocks.json" assert { type: "json" }
import iconCredits from "./extradata/iconCredits.json" assert { type: "json" }
import shops from "./extradata/shops.json" assert { type: "json" }

// TODO: make a more rigorous type import model
export const sacredTexts: IconData = {
    forms,
    robotAnimations,
    colors,
    gameSheet,
    newIconCounts: {},
    newIcons: []
}

export const extraData: ExtraData = {
    colorOrder,
    hardcodedUnlocks,
    iconCredits,
    shops,
    previewIcons: [],
    newPreviewIcons: []
}