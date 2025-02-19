import usersTest from "../constants/usersTest"

describe("When I require usersTest data", ()=>{
    it("Should return something", ()=>{
        expect(usersTest).toBeDefined()
    })
})