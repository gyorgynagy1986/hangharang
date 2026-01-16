// src/data/scenes.ts
import i18n from "../../i18n/index";

export const scenes = [
  {
    name: () => i18n.t("scenes.nappal_erdo"),
    icon: "🌳",
    backgroundImg: require("../../assets/img/nappalierdo.jpg"),
    channels: [
      {
        name: () => i18n.t("channels.zugo_szel"),
        file: require("../../assets/mp3/zugoszel.mp3"),
        img: require("../../assets/img/szel.jpg"),
      },
      {
        name: () => i18n.t("channels.enekes_rigo"),
        file: require("../../assets/mp3/enekesrigo.mp3"),
        img: require("../../assets/img/rigo.jpg"),
      },
      {
        name: () => i18n.t("channels.lappantyu"),
        file: require("../../assets/mp3/lappantyu.wav"),
        img: require("../../assets/img/lappantyu.jpg"),
      },
      {
        name: () => i18n.t("channels.damvad"),
        file: require("../../assets/mp3/damszarvas.mp3"),
        img: require("../../assets/img/damvad.jpg"),
      },
    ],
  },
  {
    name: () => i18n.t("scenes.ejszakai_erdo"),
    icon: "🌙",
    backgroundImg: require("../../assets/img/ejszakai.jpg"),
    channels: [
      {
        name: () => i18n.t("channels.fulemule"),
        file: require("../../assets/mp3/fulemule.wav"),
        img: require("../../assets/img/fulemule.jpg"),
      },
      {
        name: () => i18n.t("channels.aranysakal"),
        file: require("../../assets/mp3/aranysakal.mp3"),
        img: require("../../assets/img/aranysakal.jpg"),
      },
      {
        name: () => i18n.t("channels.macskabagoly"),
        file: require("../../assets/mp3/macskabagoly.wav"),
        img: require("../../assets/img/macskabagoly.jpg"),
      },
      {
        name: () => i18n.t("channels.kuvik"),
        file: require("../../assets/mp3/kuvik.mp3"),
        img: require("../../assets/img/kuvik.jpg"),
      },
    ],
  },
  {
    name: () => i18n.t("scenes.szikes_to"),
    icon: "🦆",
    backgroundImg: require("../../assets/img/szikes.jpg"),
    channels: [
      {
        name: () => i18n.t("channels.dankasiraly"),
        file: require("../../assets/mp3/danka.wav"),
        img: require("../../assets/img/dankasiraly.jpg"),
      },
      {
        name: () => i18n.t("channels.golyatocs"),
        file: require("../../assets/mp3/tocs.mp3"),
        img: require("../../assets/img/golyatocs.jpg"),
      },
      {
        name: () => i18n.t("channels.gulipan"),
        file: require("../../assets/mp3/gulipán.mp3"),
        img: require("../../assets/img/gulipan.jpg"),
      },
      {
        name: () => i18n.t("channels.szarcsa"),
        file: require("../../assets/mp3/szarcsa.mp3"),
        img: require("../../assets/img/szarcsa.jpg"),
      },
    ],
  },
];
