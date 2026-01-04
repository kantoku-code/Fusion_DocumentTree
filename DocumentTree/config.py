# Application Global Variables
# This module serves as a way to share variables across different
# modules (global variables).

import os

# Flag that indicates to run in Debug mode or not. When running in Debug mode
# more information is written to the Text Command window. Generally, it's useful
# to set this to True while developing an add-in and set it to False when you
# are ready to distribute it.
DEBUG = True

# Gets the name of the add-in from the name of the folder the py file is in.
# This is used when defining unique internal names for various UI elements
# that need a unique name. It's also recommended to use a company name as
# part of the ID to better ensure the ID is unique.
ADDIN_NAME = os.path.basename(os.path.dirname(__file__))
COMPANY_NAME = "kantoku"

# Palettes
sample_palette_id = f"{COMPANY_NAME}_{ADDIN_NAME}_palette_id"

# Command Definitions
CMD_NAME = "ドキュメント ツリー"
CMD_Description = "関連ドキュメントをツリー表示します"

# Palette
PALETTE_NAME = "Document Tree"

# UI Location
WORKSPACE_ID = "FusionSolidEnvironment"
TAB_ID = "ToolsTab"
TAB_NAME = "Test"
PANEL_ID = "SolidScriptsAddinsPanel"
PANEL_NAME = "Document"
PANEL_AFTER = ""

# Messages
MESSAGES = {
    "OfflineError": "オフラインモードではチェック出来ません!!",
    "NoDataError": "関連ドキュメントは有りません!",
    "UnknownUser": "?????",
    "ProjectNamePrefix": "-- プロジェクト名:{} --"
}
