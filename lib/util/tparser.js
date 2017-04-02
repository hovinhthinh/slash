
export default {
  // Return string between the regexs. Return null is not found.
  getContent: function (content, openTag, closeTag) {
    let regex = new RegExp(openTag);
    let mr = regex.exec(content);
    if (mr === null) {
      return null;
    }
    regex = new RegExp(closeTag);
    content = content.substring(mr.index + mr[0].length);

    mr = regex.exec(content);
    if (mr === null) {
      return null;
    }
    return content.substring(0, mr.index);
  },

  // Return array of strings between the regexs. Return [] is not found.
  getContentList: function (content, openTag, closeTag) {
    let openRegex = new RegExp(openTag);
    let closeRegex = new RegExp(closeTag);
    let res = [];
    let mr;

    while (1) {
      mr = openRegex.exec(content);
      if (mr === null) {
        break;
      }
      content = content.substring(mr.index + mr[0].length);
      mr = closeRegex.exec(content);
      if (mr === null) {
        break;
      }
      res.push(content.substring(0, mr.index));
      content = content.substring(mr.index + mr[0].length);
    }

    return res;
  },

  // Return string between the regexs. Return null is not found.
  getMatch: function (content, regex) {
    let rg = new RegExp(regex);
    let mr = rg.exec(content);
    if (mr === null) {
      return null;
    }
    return mr[0];
  },

  getMatchList: function (content, regex) {
    let rg = new RegExp(regex);
    let res = [];
    while (1) {
      let mr = rg.exec(content);
      if (mr === null) {
        break;
      }
      res.push(mr[0]);
      content = content.substring(mr.index + mr[0].length);
    }
    return res;
  },

  simpleRemoveTag: function (text) {
    text = text.replace(/on((change)|(click)|(load)|(submit)|(blur))\s*=\s*'[^']+'/g, ' ');
    text = text.replace(/on((change)|(click)|(load)|(submit)|(blur))\s*=\s*"[^"]+"/g, ' ');
    text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  }
};
