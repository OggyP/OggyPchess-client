<!DOCTYPE html>
<html lang="en">
<?php
$gameInfo = null;
$pgnVal = null;
$assetURL = '<link rel="stylesheet" href="/resources/svg/pieces/default.css">';
if (isset($_GET['game'])) {
    $isViewingGame = true;
    $gameId = $_GET['game'];
    $servername = "localhost";
    $username = "chess";
    $password = "CHESS@sudocode69";
    $dbname = "chess";

    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);
    // Check connection
    if ($conn->connect_error) {
        echo ("Connection failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("SELECT * FROM games WHERE id = ?");
    $stmt->bind_param('i', $gameId);

    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        // output data of each row
        while ($row = $result->fetch_assoc()) {
            $gameInfo = $row;
            $pgnVal = explode("\n", $gameInfo['pgn']);
            $pgnVal = $pgnVal[count($pgnVal) - 1];
        }
    } else {
        $isViewingGame = false;
    }
    $conn->close();
} else {
    $isViewingGame = false;
}
if (isset($_GET['assets'])) {
    $assetType = $_GET['assets'];
    if ($assetType == 'ewan') {
        $assetURL = '<link rel="stylesheet" href="/resources/svg/pieces/ewanPieces.css">';
    }
    if ($assetType == 'horsey') {
        $assetURL = '<link rel="stylesheet" href="/resources/svg/pieces/horsey.css">';
    }
    if ($assetType == 'lichess') {
        $assetURL = '<link rel="stylesheet" href="/resources/svg/pieces/lichess.css">';
    }
    if ($assetType == 'sus') {
        $assetURL = '<link rel="stylesheet" href="/resources/svg/pieces/sus.css">';
    }
}
?>

<head>
    <meta charset="UTF-8">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <title><?php if ($isViewingGame) {
                echo $gameInfo['white'] . " vs " . $gameInfo['black'];
            } else {
                echo "OggyP Chess";
            } ?></title>
    <meta name="description" content="">
    <!--    META-->
    <meta charset="UTF-8">
    <meta name="keywords" content="chess, enpassant, oggyp, jam">
    <meta name="author" content="Oscar Pritchard, Kaelan Carlos, Ewan Odenthal">
    <meta name="theme-color" content="#ffffff">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta property="og:title" content="<?php if ($isViewingGame) {
                                            echo $gameInfo['white'] . " vs " . $gameInfo['black'];
                                        } else {
                                            echo "OggyP Chess";
                                        } ?>">
    <meta property="og:description" content="<?php if ($isViewingGame) {
                                                    echo $gameInfo['score'] . " " . $gameInfo['reason'] . "\n" . $gameInfo['opening'] . "\n" . $pgnVal;
                                                } else {
                                                    echo "Play the highly popular game, chess but with mandatory enpassant! (It is a feature)";
                                                } ?>">
    <meta name="description" content="
    <?php if ($isViewingGame) {
        echo $gameInfo['score'] . " " . $gameInfo['reason'] . "\n" . $gameInfo['opening'] . "\n" . $pgnVal;
    } else {
        if ($assetType == 'ewan') {
            echo "I see you have chosen death. Enjoy being blind for the rest of your life.";
        } else {
            echo "Play the highly popular game, chess but with mandatory enpassant! (It is a feature)";
        }
    } ?>">

    <meta property="og:url" content="https://chess.oggyp.com<?php echo $_SERVER['REQUEST_URI'] ?>">
    <meta property="og:site_name" content="OggyP Chess">
    <meta property="og:image" content="/resources/images/favicon.png">

    <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png">
    <link rel="manifest" href="/favicon/site.webmanifest">
    <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#ff1500">
    <link rel="shortcut icon" href="/favicon/favicon.ico">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-config" content="/favicon/browserconfig.xml">
    <meta name="theme-color" content="#ffffff">
    <!--    END META-->

    <!--    FONTS-->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet">
    <!--    END OF FONTS-->

    <link rel="stylesheet" href="/resources/css/chess.css">
    <link rel="stylesheet" href="/resources/css/main.css">
    <link rel="stylesheet" href="/resources/css/normalise.css">
    <link rel="stylesheet" href="/resources/css/mobile.css">
    <?php
    echo $assetURL;
    ?>
</head>

<body>
    <div id="login-wrapper" class="full-screen-menu">
        <img src="/resources/images/favicon-login-bg.png" alt="" class="bg-img">

        <h1>Login</h1>
        <p id="login-info"></p>
        <form action="/" method="post" onsubmit="login(); return false;">
            <label for="username-input">Username</label>
            <input type="text" id="username-input" value="" placeholder="Username">
            <br>
            <label for="password-input">Password</label>
            <input type="password" id="password-input" value="" placeholder="Password">
            <input type="submit" hidden>
        </form>

        <button onclick="login()">
            Login
            <span class="spacer" style="display: inline-block; width: 5px;"></span>
            <span class="material-icons-round">login</span>
        </button>

        <div>
            <br>
            <span>Don't have an account?</span>
            <button onclick="showRegister();" id="nav-to-register">Register now!</button>
        </div>
    </div>

    <div id="register-wrapper" class="full-screen-menu">
        <img src="/resources/images/favicon-login-bg.png" alt="" class="bg-img">

        <h1>Register</h1>
        <p id="register-error"></p>
        <form action="/" method="post" onsubmit="register(); return false;">
            <input type="text" id="username-register" value="" placeholder="Username"><br>
            <input type="password" id="password-register" value="" placeholder="Password"><br>
            <input type="password" id="password-register-verify" value="" placeholder="Verify Password">
            <input type="submit" hidden>
        </form>

        <button onclick="register()">
            Register
            <span class="spacer" style="display: inline-block; width: 5px;"></span>
            <span class="material-icons-round">add_circle</span>
        </button>

        <div>
            <br>
            Already have an account?
            <button onclick="showLogin()" id="nav-to-login">Login here!</button>
        </div>
    </div>

    <div id="home" class="full-screen-menu panelled">
        <div>
            <h1><img src="/resources/images/favicon.png" alt="icon"> OggyP Chess</h1>

            <h2>Play</h2>
            <hr>
            <button class="home_item" id="open-standard" onclick="showTimeSelection(this, 'standard')">Standard</button>
            <button class="home_item" id="open-960" onclick="showTimeSelection(this, '960')">Chess 960</button>
            <button class="home_item" id="open-stockfish" onclick="openHomeMenu(this, '#stockfish-skill-selector')">Versus Stockfish</button>
            <button class="home_item" id="open-opening-explorer" onclick="openHomeMenu(this, '#stockfish-skill-selector')">Opening Explorer</button>

            <br><br>
            <button class="home_item" id="open-import" onclick="openHomeMenu(this, '#import-menu')">
                Import a game
            </button>
            <!--<button class="devtools" onclick="showGame()">Show board</button>-->

            <div id="import-menu" class="fill-on-small-screen home_menu">
                <button class="closebtn" onclick="closeHomeMenu('#import-menu')">&times;</button>

                <label for="pgn_input">PGN Input</label>
                <textarea id="pgn_input"></textarea>
                <button onclick="$('#game_import_wrapper').hide(); $('#loading-reason').text(' game'); $('#loading').show(); parsePGN($('textarea#pgn_input').val())">
                    Import
                </button>
            </div>

            <div id="time-selection-menu" class="fill-on-small-screen home_menu">
                <button class="closebtn" onclick="closeHomeMenu('#time-selection-menu')">&times;</button>

                <h3 id="time-selection-queue-mode">Standard</h3>
                <h4>Time Controls</h4>
                <h3>Starting Time (Mins)</h3>
                <div id="time_control_start">
                    <input type="radio" id="time_control_start_0.5" name="time_control_start" value="0.5">
                    <label for="time_control_start_0.5" class="button">0.5</label>
                    <input type="radio" id="time_control_start_1" name="time_control_start" value="1">
                    <label for="time_control_start_1" class="button">1</label>
                    <input type="radio" id="time_control_start_2" name="time_control_start" value="2">
                    <label for="time_control_start_2" class="button">2</label>
                    <input type="radio" id="time_control_start_3" name="time_control_start" value="3">
                    <label for="time_control_start_3" class="button">3</label>
                    <input type="radio" id="time_control_start_5" name="time_control_start" value="5">
                    <label for="time_control_start_5" class="button">5</label>
                    <input type="radio" id="time_control_start_10" name="time_control_start" value="10">
                    <label for="time_control_start_10" class="button">10</label>
                    <input type="radio" id="time_control_start_15" name="time_control_start" value="15">
                    <label for="time_control_start_15" class="button">15</label>
                    <input type="radio" id="time_control_start_30" name="time_control_start" value="30">
                    <label for="time_control_start_30" class="button">30</label>
                </div>

                <h3>Increment Time (Secs)</h3>
                <div id="time_control_inc">
                    <input type="radio" id="time_control_inc_0" name="time_control_inc" value="0">
                    <label for="time_control_inc_0" class="button">0</label>
                    <input type="radio" id="time_control_inc_1" name="time_control_inc" value="1">
                    <label for="time_control_inc_1" class="button">1</label>
                    <input type="radio" id="time_control_inc_2" name="time_control_inc" value="2">
                    <label for="time_control_inc_2" class="button">2</label>
                    <input type="radio" id="time_control_inc_3" name="time_control_inc" value="3">
                    <label for="time_control_inc_3" class="button">3</label>
                    <input type="radio" id="time_control_inc_5" name="time_control_inc" value="5">
                    <label for="time_control_inc_5" class="button">5</label>
                    <input type="radio" id="time_control_inc_10" name="time_control_inc" value="10">
                    <label for="time_control_inc_10" class="button">10</label>
                    <input type="radio" id="time_control_inc_20" name="time_control_inc" value="20">
                    <label for="time_control_inc_20" class="button">20</label>
                </div>
                <button onclick="joinQueue()">Queue</button>
            </div>
            <div id="stockfish-skill-selector" class="fill-on-small-screen home_menu">
                <h3>Stockfish Difficulty: <span id="stockfish-difficulty">20</span></h3>
                <button class="closebtn" onclick="closeHomeMenu('#stockfish-skill-selector')">&times;</button>
                <input type="range" min="0" max="20" value="20" id="stockfish-slider">
                <button onclick="vsStockfish()">Play</button>
            </div>
        </div>

        <!--        PREVIOUS GAMES-->
        <div id="account" class="panel">
            <div id="account-info">
                <div class="spread-items">
                    <h2 id="account-username">Username</h2>
                    <button onclick="logout()" id="logout_button">Logout</button>
                </div>

                <span id="join-date">Joined </span>
            </div>

            <h3><u>Game history</u></h3>
            <div class="centre-items">
                <div id="previous_games-wrapper">
                    <table id="previous_games"></table>
                </div>
            </div>
        </div>
    </div>

    <div id="queue_page" class="full-screen-menu">
        <h2>Queueing for <span id="queue_mode"></span></h2>
        <h3 id="queue_timing">Unlimited</h3>
        <button onclick="sendToWs('home', []); $('#queue_page').hide(); $('#home').show();">Home</button>
    </div>
    <div id="loading" class="full-screen-menu">
        <h2 class="loading">Loading<span id="loading-reason"></span></h2>
    </div>
    <div id="game_wrapper" class="full-screen-menu panelled">
        <div id="chess_board-wrapper">
            <div id="chess_board">
                <div id="pieces_layer"></div>
                <div id="valid_positions"></div>
            </div>
        </div>
        <div class="panel">
            <div id="move_wrapper">
                <table id="move_list">
                    <tr>
                        <th></th>
                        <th id="white_player">White's Move</th>
                        <th id="black_player">Black's Move</th>
                    </tr>
                    <tr id='timer-row'>
                        <th></th>
                        <th id="white_timer"><span id='white_timer_text' class='timer_text'></span></th>
                        <th id="black_timer"><span id='black_timer_text' class='timer_text'></span></th>
                    </tr>
                </table>
            </div>
            <div id="options">
                <h4 id="opening" class="info-text">Starting Position</h4>
                <h5 id="fen_display" class="info-text">FEN Value</h5>
                <div id="evaluation_wrapper">
                    <h3 id="evaluation" class="info-text">Analysing...</h3>
                    <h5 id="evaluation_extra"></h5>
                </div>
                <button onclick="flipBoard = !flipBoard; drawBoard(reDrawBoard, lastMoveNum); valid_positions.empty()">Flip Board</button>
                <button id="resume_game" onclick="drawCurrentBoard = true; showingBoard = moveNum; drawBoard(); $('#resume_game').hide()" style="display: none;">Resume</button>
                <button id="stop_stop_animation" onclick="startPlayAnimation()">Play</button>
                <button onclick="download('game.pgn')" class="download_pgn">Download PGN</button>
                <button id="reset_game" onclick="resetGame()" style="display: none;">Go Home</button>
                <button id="share_game" onclick="copyURLToClipboard()" style="display: none;">Share</button>
                <button id="in_game_login" onclick="$('#login-wrapper').show(); $('#game_wrapper').hide(); checkForToken()">Login</button>
                <div id="in_game_options">
                    <button onclick="resign()">Resign</button>
                </div>
            </div>
        </div>
    </div>
    <div id="fatal-error" class="full-screen-menu">
        <h2 id="fatal-error-type"></h2>
        <p id="fatal-error-description"></p>
    </div>
    <script src="resources/javascript/openingList.js"></script>
    <script src="resources/javascript/account.js"></script>
    <script src="resources/javascript/functions.js"></script>
    <script src="resources/javascript/getInput.js"></script>
    <script src="resources/javascript/multiplayer-chess.js"></script>
    <script src="resources/javascript/wsHandle.js"></script>
    <script src="resources/stockfish/engine.js"></script>
    <script>
        (function fix_workers() {
            var script_tag;
            /// Does the environment support web workers?  If not, include stockfish.js directly.
            ///NOTE: Since web workers don't work when a page is loaded from the local system, we have to fake it there too. (Take that security measures!)
            if (!Worker || (location && location.protocol === "file:")) {
                var script_tag = document.createElement("script");
                script_tag.type = "text/javascript";
                script_tag.src = "resources/stockfish/stockfish.js";
                script_tag.onload = init;
                document.getElementsByTagName("head")[0].appendChild(script_tag);
                wait_for_script = true;
                setTimeout(function() {
                    console.warn("Loading this example from the file: protocol will load the slower asm.js engine.\nRun server.js and then load http://localhost:8080/ for the WASM engine.");
                }, 3000);
            }
        }());
    </script>
</body>

</html>
